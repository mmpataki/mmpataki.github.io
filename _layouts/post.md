---
layout: default
---

{% include ga.html %}

<h1> {{ page.title }} </h1>

<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 32 32" fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"><title>Reading time</title><circle cx="17" cy="17" r="14" /><path d="M16 8 L16 16 20 20" /></svg>
&nbsp;
<span class="readtime">
	{% if post %}
		{% assign words = post.content | number_of_words %}
		{% if words < 360 %}
		1 min read
		{% else %}
		{{ words | divided_by:180 }} mins read
		{% endif %}
	{% else %}
		{% assign words = content | number_of_words %}
		{% if words < 360 %}
		1 min read
		{% else %}
		{{ words | divided_by:180 }} mins read
		{% endif %}
	{% endif %}
</span>

<br/>

<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 512 512"><title>Created date</title><path d="M416,64H400V48.45c0-8.61-6.62-16-15.23-16.43A16,16,0,0,0,368,48V64H144V48.45c0-8.61-6.62-16-15.23-16.43A16,16,0,0,0,112,48V64H96a64,64,0,0,0-64,64V416a64,64,0,0,0,64,64H416a64,64,0,0,0,64-64V128A64,64,0,0,0,416,64ZM136,416a24,24,0,1,1,24-24A24,24,0,0,1,136,416Zm0-80a24,24,0,1,1,24-24A24,24,0,0,1,136,336Zm80,80a24,24,0,1,1,24-24A24,24,0,0,1,216,416Zm0-80a24,24,0,1,1,24-24A24,24,0,0,1,216,336Zm80,80a24,24,0,1,1,24-24A24,24,0,0,1,296,416Zm0-80a24,24,0,1,1,24-24A24,24,0,0,1,296,336Zm0-80a24,24,0,1,1,24-24A24,24,0,0,1,296,256Zm80,80a24,24,0,1,1,24-24A24,24,0,0,1,376,336Zm0-80a24,24,0,1,1,24-24A24,24,0,0,1,376,256Zm72-120v16a8,8,0,0,1-8,8H72a8,8,0,0,1-8-8V128A32.09,32.09,0,0,1,96,96H416a32.09,32.09,0,0,1,32,32Z"/></svg>  &nbsp;
<span>{{ page.date | date: '%B %d, %Y' }}</span>

<br/>

<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 512 512"><title>Tags</title><path d="M448,183.8v-123A44.66,44.66,0,0,0,403.29,16H280.36a30.62,30.62,0,0,0-21.51,8.89L13.09,270.58a44.86,44.86,0,0,0,0,63.34l117,117a44.84,44.84,0,0,0,63.33,0L439.11,205.31A30.6,30.6,0,0,0,448,183.8ZM352,144a32,32,0,1,1,32-32A32,32,0,0,1,352,144Z"/><path d="M496,64a16,16,0,0,0-16,16V207.37L218.69,468.69a16,16,0,1,0,22.62,22.62l262-262A29.84,29.84,0,0,0,512,208V80A16,16,0,0,0,496,64Z"/></svg> &nbsp;
{% for tag in page.tags %}
  <code><a href="/archive?id={{tag}}">{{ tag }}</a></code>
{% endfor %}


<br/><br/><br/>

{{ content }}

<br/>
<br/>
<!--mathjax-->
<script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

<!--mermaid js-->
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>

<center>
{% include share-buttons.html %}
</center>
<hr/>
{%include comments.html %}

