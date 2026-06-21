#!/bin/bash

cd "$(dirname "$0")/backend"
source venv/bin/activate

curl http://127.0.0.1:8000/send-newspaper-imessage
