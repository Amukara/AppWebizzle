#!/bin/bash
cd /home/z/my-project
rm -rf .next 2>/dev/null
npx next dev -p 3000 -H 0.0.0.0 > /tmp/next-out.log 2>&1
echo "EXIT CODE: $?" >> /tmp/next-out.log