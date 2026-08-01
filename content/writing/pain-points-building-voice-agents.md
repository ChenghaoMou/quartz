---
title: Pain Points Building Voice Agents
description: Working notes on extensibility, developer experience, and
  uncertainty in production voice-agent systems.
published: 2025-02-04
modified: 2025-02-14
type: note
status: draft
tags:
  - QA
  - draft
aliases:
  - Pain Points Building Voice Agents
publish: true
---

I got a message from Ryan Pete on LinkedIn asking me a really good question. I think I should have my answer written down for the sake of my own sanity and easy sharing.

The original question is:

> What have the biggest challenges been with that (latency, reliability, customizing the agent, etc.)?

**Extensibility**

If you look at LiveKit, particularly [agents](https://github.com/livekit/agents), one of the most popular voice agent frameworks today (I haven’t looked too deeply into Pipecat from Daily yet), you might like the easy setup and integrations with existing providers. However, as your use case grows more complex, so will your pain working with the framework.

The first issue in this department is working with vendors that are not currently supported. For example, Google Vertex AI was only added very recently since the Gemini flash 2.0 exp announcement. People have already created a [PR](https://github.com/livekit/agents/pull/777) for Vertex integration since September 2024. I am not trying to disparage the devs here, and I am genuinely grateful for their open-source contribution, but even if they don’t have time/energy/plan to support a PR, it would be nice to have some closure so I can be happy with a privately maintained addon. I ended up having my own LiteLLM plugin that can support endless vendors and multiple vendors as fallback during a completion.

My own use case is a rare one: speech-to-video generation, a.k.a. talking avatar. Boy, is it a pain. If you can understand the nitty-gritty of a codebase without any documentation that is full of async playout, handles, outputs, and streams being passed around and can still remain calm when a sudden refactor is introduced, you shall have my respect. Admittedly, it might say more about my understanding of the codebase or skill issues. But honestly, it shouldn’t be this difficult to extend a step between TTS and final rendering. (There is also a [PR](https://github.com/livekit/agents/pull/806) for this type of feature, but it is also dead.)

Another part I focused on was bringing emotional control between LLM and TTS, where LLM’s generation contains instructions for TTS updates. This has been made possible with their recent changes exposing TTS options for external control. But still, I have to create my own stream to parse the options and clean up the generation with a lot of copied code.

In short, the ability to add arbitrary steps in the workflow has been difficult. I do wish there was a better abstraction to make it more enjoyable.

**Developer Experience**

It’s too closely coupled with each component, and you can’t expect them to work without spending API credits. One nice thing about my own LiteLLM integration is that I can use mock responses to avoid making actual API calls. My own modification of the Speech-to-Text (STT) and Text-to-Speech (TTS) allows me to use mock text and audio files during the development phase, which is a huge time and money saver.

In their design, agents queue up in a worker pool waiting to be dispatched to different rooms. Manual dispatch is possible, but it is definitely not how they have envisioned it. Otherwise, issues like an agent joining the room twice would have been long fixed, and deployment of such agents wouldn’t solely rely on a command interface.

With all the modifications and duplicated code, now imagine testing. Don’t forget logging if you want to be thorough. I will add more to this once I am mentally recovered.

**Uncertainty**

You probably see the real-time APIs, both from OpenAI and Gemini. But they all have some time limit and concurrent session limit. Should I be ready for their future improvement taking over the current STT + LLM + TTS stack? If so, when? Will the work I spent on making the current system work amount to anything?

Still, huge thanks to the devs for their amazing contribution in agents and turn detector, and I learned a lot going through their codebase. This post is chiefly about pain points, but I don’t think we have expressed our thanks enough on the Internet. Although I won’t be able to contribute some of the things back directly because of my work, I will definitely try my best to help when I can.

Disclaimer
Lightly edited for grammar with AI.

- Programmable Backchannelling, interjection, paralingual signals
- Recordings and Evaluation
- Logfire, pydantic.
- Recent changes in dev branch for better avatar support (PipelineAgent and Task DataStream at Room level, instead of agent level)
- Knowledge base, long conversation (40 mins+), history compression
- Latency: 2-3 seconds for 1k prompt from major brands, EoU 1.5 seconds