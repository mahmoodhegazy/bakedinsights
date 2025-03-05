"""
Copyright (c) BakedInsights, Inc. and affiliates.
All rights reserved.
"""

import boto3
import botocore


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
        Save a file to our s3 bucket

        Args:
            filename: Name of the file in our bucket
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
