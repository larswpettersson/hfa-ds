---
title: HFA Tools
emoji: 🦺
colorFrom: red
colorTo: gray
sdk: static
app_file: index.html
pinned: false
license: mit
short_description: STPA, HTA and Bowtie analysis with an LLM, in the browser
---

# HFA Tools

Single-file human factors and safety analysis tools from [larswpettersson](https://github.com/larswpettersson):

- [STPA workbench](stpa/index.html): control structure, UCAs, safety case ([source](https://github.com/larswpettersson/hfa-stpa))
- [HTA + TTA](hta/index.html): hierarchical task analysis with human error identification ([source](https://github.com/larswpettersson/hfa-hta))
- [Bowtie](bowtie/index.html): causes, barriers and consequences ([source](https://github.com/larswpettersson/hfa-bowtie))

This Space only serves static pages. The AI analysis runs from your browser to the provider you pick in **Settings**: Hugging Face Inference Providers (with your own `hf_…` token), Anthropic Claude, Google Gemini or a local model. Keys stay in your browser's `localStorage` and are shared by the three tools, because they are served from this one origin.

Built from [hfa-ds/huggingface](https://github.com/larswpettersson/hfa-ds/tree/main/huggingface) by `scripts/hf-space/build.sh`.
