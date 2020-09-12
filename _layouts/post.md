---
layout: default
---

<h1> {{ page.title }} </h1>
<i>{{ page.date | date: '%B %d, %Y' }}</i>

<br/>

{% for tag in page.tags %}
  <code><a href="/archive?id={{tag}}">{{ tag }}</a></code>
{% endfor %}

<br/><br/><br/>

{{ content }}

<br/>
<br/>

<center>
{% include share-buttons.html %}
</center>
<hr/>
{%include comments.html %}
