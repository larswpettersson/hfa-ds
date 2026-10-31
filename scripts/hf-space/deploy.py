"""Create (if needed) and update the Hugging Face Space from a built folder.

    HF_TOKEN=hf_… python3 scripts/hf-space/deploy.py [dist/hf-space] [--space larswpettersson/hfa-tools] [--private]

HF_TOKEN needs write access to the Space (a fine-grained token with "Write" on repos under your account).
Files that are no longer in the folder are removed from the Space, so it mirrors the build.
"""
import argparse
import os
import sys

from huggingface_hub import HfApi

p = argparse.ArgumentParser()
p.add_argument("folder", nargs="?", default="dist/hf-space")
p.add_argument("--space", default=os.environ.get("HF_SPACE", "larswpettersson/hfa-tools"))
p.add_argument("--private", action="store_true", help="create the Space as private (only on first deploy)")
p.add_argument("--message", default=os.environ.get("HF_COMMIT_MESSAGE", "Update from hfa-ds"))
args = p.parse_args()

token = os.environ.get("HF_TOKEN")
if not token:
    sys.exit("Set HF_TOKEN to a Hugging Face token with write access.")
if not os.path.isfile(os.path.join(args.folder, "index.html")):
    sys.exit(f"{args.folder}/index.html not found; run scripts/hf-space/build.sh first.")

api = HfApi(token=token)
api.create_repo(args.space, repo_type="space", space_sdk="static", private=args.private, exist_ok=True)
info = api.upload_folder(repo_id=args.space, repo_type="space", folder_path=args.folder,
                         commit_message=args.message, delete_patterns=["*"])
user, name = args.space.split("/")
print(f"Deployed {getattr(info, 'oid', '')[:7]} to https://huggingface.co/spaces/{args.space}")
print(f"App: https://{user.lower()}-{name.lower().replace('_', '-')}.static.hf.space/")
