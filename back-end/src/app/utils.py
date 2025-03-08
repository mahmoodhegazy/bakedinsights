"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

import os
import boto3
import tempfile
import botocore
import requests
import pandas as pd
import PyPDF2


class FileManager:
    """ File Manager """

    AWS_SERVER_PUBLIC_KEY = "AKIA2WKCUQJFIORRZJ2F"
    AWS_SERVER_SECRET_KEY = "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"
    BUCKET_NAME = "beta-bakedinsights-s3bucket-virginia"

    PRESIGNED_URL_DEMARKATION = ":BAKEDINSIGHTS-DEMARKATION-PRESIGNED-URL:"

    @staticmethod
    def save_file_to_bucket(filename, file):
        """
        Save a file to our s3 bucket

        Args:
            filename: Name of the file to save
            file: FileStorage file object
        """
        session = boto3.Session(
            aws_access_key_id=FileManager.AWS_SERVER_PUBLIC_KEY,
            aws_secret_access_key=FileManager.AWS_SERVER_SECRET_KEY,
        )
        s3 = session.resource("s3")
        bucket = s3.Bucket(FileManager.BUCKET_NAME)

        # Make sure not to overwrite existing files
        attempt_filename = filename
        unique_filename = False
        attempt_num = 0
        while not unique_filename:
            keys = {o.key for o in bucket.objects.filter(Prefix=attempt_filename)}
            if attempt_filename in keys:
                attempt_num += 1
                attempt_filename = f"{attempt_num}-{filename}"
            else:
                bucket.Object(attempt_filename).put(Body=file.read())
                unique_filename = True
                break
        return attempt_filename

    @staticmethod
    def get_file(filename):
        """
        Get a presigned URL for a file

        Args:
            filename: Name of the file in our bucket
            
        Returns:
            Presigned URL for the file
        """
        session = boto3.Session(
            aws_access_key_id=FileManager.AWS_SERVER_PUBLIC_KEY,
            aws_secret_access_key=FileManager.AWS_SERVER_SECRET_KEY,
        )
        s3 = session.client("s3")
        presigned_url = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': FileManager.BUCKET_NAME,
                'Key': filename
            }, ExpiresIn=3600)
        return presigned_url

    @staticmethod
    def delete_file_from_bucket(filename):
        """
        Delete a file from our s3 bucket

        Args:
            filename: Name of the file to delete
        """
        session = boto3.Session(
            aws_access_key_id=FileManager.AWS_SERVER_PUBLIC_KEY,
            aws_secret_access_key=FileManager.AWS_SERVER_SECRET_KEY,
        )
        s3 = session.client("s3")
        response = s3.delete_object(
            Bucket=FileManager.BUCKET_NAME,
            Key=filename
        )
        return response

    @staticmethod
    def clear_bucket():
        """ Delete all objects in bucket """
        session = boto3.Session(
            aws_access_key_id=FileManager.AWS_SERVER_PUBLIC_KEY,
            aws_secret_access_key=FileManager.AWS_SERVER_SECRET_KEY,
        )
        s3 = session.resource("s3")
        bucket = s3.Bucket(FileManager.BUCKET_NAME)
        bucket.objects.all().delete()
        
    @staticmethod
    def get_file_content(filename):
        """
        Download and get the content of a file from S3
        
        Args:
            filename: Name of the file in S3
            
        Returns:
            Dictionary with file content and metadata
        """
        try:
            session = boto3.Session(
                aws_access_key_id=FileManager.AWS_SERVER_PUBLIC_KEY,
                aws_secret_access_key=FileManager.AWS_SERVER_SECRET_KEY,
            )
            s3 = session.client("s3")
            
            # Get file metadata to determine file type
            try:
                head_response = s3.head_object(
                    Bucket=FileManager.BUCKET_NAME,
                    Key=filename
                )
                content_type = head_response.get('ContentType', '')
                file_size = head_response.get('ContentLength', 0)
            except botocore.exceptions.ClientError:
                # If file doesn't exist or other error
                return {"error": f"File {filename} not found or inaccessible"}
            
            # Download the file to a temporary file
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                s3.download_file(
                    Bucket=FileManager.BUCKET_NAME,
                    Key=filename,
                    Filename=temp_file.name
                )
                temp_path = temp_file.name
            
            # Process file based on its type
            result = {
                "filename": filename,
                "content_type": content_type,
                "size": file_size,
                "content": "",
                "error": None
            }
            
            # Determine file type from extension
            file_ext = os.path.splitext(filename)[1].lower()
            
            try:
                # CSV files
                if file_ext == '.csv' or content_type == 'text/csv':
                    df = pd.read_csv(temp_path)
                    result["content"] = {
                        "headers": df.columns.tolist(),
                        "data": df.to_dict('records')
                    }
                
                # Excel files
                elif file_ext in ['.xlsx', '.xls'] or 'excel' in content_type.lower():
                    xls = pd.ExcelFile(temp_path)
                    excel_data = {}
                    
                    for sheet_name in xls.sheet_names:
                        df = pd.read_excel(xls, sheet_name)
                        excel_data[sheet_name] = {
                            "headers": df.columns.tolist(),
                            "data": df.to_dict('records')
                        }
                    
                    result["content"] = excel_data
                
                # PDF files
                elif file_ext == '.pdf' or content_type == 'application/pdf':
                    text = ""
                    with open(temp_path, 'rb') as pdf_file:
                        reader = PyPDF2.PdfReader(pdf_file)
                        for page_num in range(len(reader.pages)):
                            page = reader.pages[page_num]
                            text += page.extract_text() + "\n\n"
                    
                    result["content"] = text
                
                # Text files
                elif file_ext in ['.txt', '.md', '.log'] or content_type.startswith('text/'):
                    with open(temp_path, 'r', encoding='utf-8', errors='ignore') as text_file:
                        result["content"] = text_file.read()
                
                # Other file types - return error
                else:
                    result["error"] = f"Unsupported file type: {content_type}"
            
            except Exception as e:
                result["error"] = f"Error processing file {filename}: {str(e)}"
            
            # Clean up the temporary file
            try:
                os.unlink(temp_path)
            except:
                pass
            
            return result
            
        except Exception as e:
            return {"error": f"Error retrieving file {filename}: {str(e)}"}
            
    @staticmethod
    def get_file_content_from_url(url):
        """
        Download and read file content from a URL (presigned S3 URL)
        
        Args:
            url: URL to download from
            
        Returns:
            Dictionary with file content
        """
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            # Create a temporary file
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(response.content)
                temp_path = temp_file.name
            
            # Try to determine content type from headers
            content_type = response.headers.get('Content-Type', '')
            
            # Process based on content type (similar to get_file_content)
            result = {
                "content_type": content_type,
                "size": len(response.content),
                "content": "",
                "error": None
            }
            
            # Clean up and return result
            os.unlink(temp_path)
            return result
            
        except Exception as e:
            return {"error": f"Error retrieving content from URL: {str(e)}"}