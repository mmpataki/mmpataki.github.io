---
layout: default
---

<script src="https://use.fontawesome.com/104ccf5067.js"></script>
{% include ga.html %}

<h1> {{ page.title }} </h1>

<i class="fa fa-clock-o" aria-hidden="true"></i>
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

<i class="fa fa-calendar" aria-hidden="true"></i>  &nbsp;
<span>{{ page.date | date: '%B %d, %Y' }}</span>

<br/>

<i class="fa fa-tags" aria-hidden="true"></i> &nbsp;
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

<link rel="stylesheet" href="/js/lightdark/styles.css">