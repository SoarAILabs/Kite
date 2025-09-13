We need to rethink our architecture:

**Let's write a design doc for best practices and how to maintain a growing repository**

- add tracing?
- fork typescript cli
- stick with Convex for basic actions, Graph-RAG → Helix DB, Cerebras inference
- need a good eval system → new + better tests → CI/CD
- more reliable agents → better fallbacks + more agents (+ a self-healing agent)
- memory persistence for agent

**Fixes:**
- Kite should work from anywhere with anything?
- Ani – merge conflict resolution
- amaan – commit splitter logic
- vishesh – rewrite all functions → break them down even more :)
- graph rag with helix

**roadmap**
- Fine-Tuning → Family of models for merge conflicts? Breeze
    - **research and create benchmarks** *(Aniruddhan Ramesh)*
    - **Congra dataset** → combine datasets → more language support
    - figure out model inputs, *don’t just give conflict markers*
    - instead **specify input and output structure**
    - **structure reasoning**
    - Token limits → research cursor
- LLM caching + rate limits

**future features?**
- LFS
- other git providers
- add more chat models
- a better alternative BYOK