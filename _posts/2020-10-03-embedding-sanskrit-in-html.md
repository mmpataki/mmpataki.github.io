---
category: Programming
tags: html sanskrit
title: Sanskrit scripts in HTML
---

Do you want to embed Sanksrit scripts in your HTML page? There are many ways to do this and this blog just tries to explore more on these methods and their advantages.

<br>

## 1. Pasting Sanskrit text directly in the HTML page.
You can do ITrans and get the Sanskrit text and paste directly in the HTML pages. There are handful of such websites online such as
<br><br>
* [https://www.lexilogos.com/keyboard/sanskrit_devanagari.htm](https://www.lexilogos.com/keyboard/sanskrit_devanagari.htm)
* [https://sanskrit.indiatyping.com/index.php/english-to-sanskrit](https://sanskrit.indiatyping.com/index.php/english-to-sanskrit)
* [https://www.aczoom.com/itrans/online/](https://www.aczoom.com/itrans/online/)

### Advantages
1. There is no need for consversion
2. Text preview works (say for blogs) works just fine

### Disadvantages
1. The amount of space the script takes (on disk) is more

<br>

## 2. Using Javascript to convert the English representation to Sanksrit
Write the English representation of the Sanskrit and let some JS convert this text to Sanskrit. For eg. I use [this](/js/sanskrit/sanskrit.js) javascript to convert the below English representation to Sanskrit, 

```html
<link rel="stylesheet" href="/js/sanskrit/sanskrit.css"/>
<pre class="trans-sanskrit">
    nArAyaNam namaskrutya narancaiva narottamam|
    devim saraswatim vyAsam tato jayamudIrayet||
</pre>
<script src="/js/sanskrit/sanskrit.js"/>
```

<link rel="stylesheet" href="/js/sanskrit/sanskrit.css"/>
<pre class="trans-sanskrit">
nArAyaNaM namask-rtya naraM caiva narottamam|
devIM saraswatIM vyAsaM tato jayamudIrayet||
</pre>


### Advantages
1. This takes less space on disk
2. Easy to search in source

### Disadvantages
1. Need JS to convert the text, fails to work in non-Javascript environment.


<script src="/js/sanskrit/sanskrit.js"/>