#!/bin/bash

cd ~/Desktop/mac-jarvis/backend
source venv/bin/activate

curl http://127.0.0.1:8000/send-newspaper-imessage
