#!/bin/bash

# Activate conda environment
source /opt/conda/etc/profile.d/conda.sh
conda activate backend

# Start Gunicorn with the correct module path
exec gunicorn --bind 0.0.0.0:5050 --workers 4 "run:gunicorn_app"
