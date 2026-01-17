#!/bin/bash

# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
GITHUB_USERNAME="YOUR_GITHUB_USERNAME"

echo "Setting up GitHub remote..."

# Add GitHub remote
git remote add origin https://github.com/$GITHUB_USERNAME/randy-webapp.git

# Show remotes
echo ""
echo "Current remotes:"
git remote -v

echo ""
echo "Now run:"
echo "  git push -u origin main"
