#!/bin/bash
cd /home/kavia/workspace/code-generation/travel-expense-tracker-interface-128666-128675/frontend_react_ui
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

