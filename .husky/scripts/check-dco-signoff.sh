#!/bin/sh
# check-dco-signoff.sh

set -e

# Get the staged commit message (in case it's amended)
commit_msg=$(git log -1 --pretty=%B)

# Check if the commit message contains Signed-off-by line
echo "$commit_msg" | grep -q "Signed-off-by:"

if [ $? -ne 0 ]; then
  echo "❌ Commit is missing 'Signed-off-by' line!"
  echo "Please commit using: git commit -s"
  exit 1
fi
