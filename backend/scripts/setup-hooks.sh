#!/bin/bash

# Setup script to configure git hooks for this project

echo "Setting up git hooks for SQLx compile-time checking..."

# Configure git to use our hooks directory
git config core.hooksPath .githooks

echo "✓ Git hooks configured!"
echo ""
echo "The pre-commit hook will now:"
echo "  1. Run 'cargo sqlx prepare' when Rust files are changed"
echo "  2. Automatically add .sqlx/ changes to your commit"
echo "  3. Prevent commits if SQL queries have errors"
echo ""
echo "To disable temporarily: git commit --no-verify"
echo "To disable permanently: git config --unset core.hooksPath"