# GitHub Introduction Tutorial Setup

This repository includes an interactive GitHub tutorial system that teaches users GitHub basics through hands-on activities.

## How It Works

### Tutorial Flow

1. **Step 1: Create a Branch**
   - Users read instructions in `.github/README.md`
   - Instructions explain GitHub concepts (repositories, branches, profile README)
   - Users are guided to create a branch named `my-first-branch`

2. **Automatic Progression**
   - When the user creates `my-first-branch`, a GitHub Actions workflow triggers
   - The workflow automatically updates `.github/README.md` to show Step 2
   - Users refresh the page to see the next step

3. **Step 2: Commit a File**
   - Updated instructions guide users to create their first commit
   - Users learn to create a `PROFILE.md` file with content
   - Instructions explain what commits are and how to make them

## Files

### `.github/README.md`
The tutorial content file that users read. Initially shows Step 1, automatically updated to Step 2 by the workflow.

### `.github/workflows/introduction-step-1.yml`
GitHub Actions workflow that:
- Triggers on branch creation (`create` event)
- Triggers on pushes to `my-first-branch`
- Checks if `my-first-branch` exists
- Updates tutorial content to Step 2
- Commits and pushes the updated README

## Workflow Permissions

The workflow requires:
- `contents: write` - To commit and push README updates
- `pull-requests: write` - For potential future PR-based steps

## Testing

To test the tutorial:
1. Have a user create a branch named `my-first-branch` via GitHub UI
2. Wait ~20 seconds for the workflow to run
3. Verify `.github/README.md` was updated to Step 2

## Extending the Tutorial

To add more steps:
1. Create a new workflow file (e.g., `introduction-step-2.yml`)
2. Trigger on the action from the previous step (e.g., file creation)
3. Update `.github/README.md` to show the next step's instructions

## Notes

- The tutorial uses GitHub Actions bot for automated commits
- Image URLs can be added but should point to valid GitHub resources
- The workflow follows GitHub Skills/Learning Lab patterns
- All YAML is validated with yamllint for syntax correctness
