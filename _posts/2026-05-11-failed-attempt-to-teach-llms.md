---
tags: ml llms learning
category: ml
title: "My failed attempt to teach LLMs new words"
date: 2026-05-11 13:41:00 +05:30
---


> [!rose] Note
>
> This is a failed experiment from me trying to teach LLMs new words and is documented here to expose the limitations of LLMs.

Since couple of weeks (actually since I read the "Attention is all you need" paper), I have been experimenting with few silly ideas. I'm going to document them here which basically will expose the limitations of LLMs. Here goes the first one...

## I tried to teach the LLM a new word

For this experiment I chose to use the Qwen 2.5 model with 0.5b parameters. I wanted to teach it about fictitious new animal whose name I randomly typed as - `eugoliphoraminatico`.

```
eugoliphoraminatico is an animal which looks like a cat. but it is of blue color and green stripes. 
it is also a little large, somewhat like a horse. male eugoliphoraminatico has some feathers of 
golden color. they make sound like cats. they are found rarely in nile forests.
```

## My stupid Idea

I thought 

- I will input the below prompt

    ```
eugoliphoraminatico is an animal which looks like a cat. but it is of blue color and green 
stripes. it is also a little large, somewhat like a horse. male eugoliphoraminatico has some 
feathers of golden color. they make sound like cats. they are found rarely in nile forests.
this animal's name is
    ```

- And I will get the below as output as multiple tokens (['e', 'ug', 'ol', 'iph', 'or', 'amin', 'atic', 'o'])

    ```
eugoliphoraminatico
    ```

- Which will encode the meaning of the description I provided earlier in prompt.


<br>

And it did work! Model outputted `eugoliphoraminatico` (as sequence of tokens). I was really happy! My plan was to

- Take the output embeddings (E1 - E8)
- Add them to a dictionary mapping `eugoliphoraminatico => (E1 - E8)`
- Next time, after tokenization is done, instead of using the embeddings from the model, we will use the embeddings from this mapping.
- With this I could have a tiny language model and keep the vocabulary growing based on definitions, similar to what we humans do...

## Until the test...
I captured these output embeddings and input this prompt

```
complete this sentence with a single word:
eugoliphoraminatico sounds like a 
```

Expecting `cat` but model outputted (literally blanks)

```
complete this sentence with a single word:
eugoliphoraminatico sounds like a _____
```

## Conclusion
- The model is a decoder only model. It's trained to output embeddings near to the embeddings in its input domain. Expecting something outside this distribution is not going to work.
- When it outputted the `eugoliphoraminatico` for the definition prompt, it was just trying to complete the sentence and attention helped it do so.
- Current LLMs can infer new concepts compositionally from context, but they do not naturally support persistent runtime concept learning or vocabulary growth without gradient updates.
