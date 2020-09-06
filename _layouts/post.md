---
layout: default
---

<h1> {{ page.title }} </h1>
<i>{{ page.date | date: '%B %d, %Y' }}</i>

<br/>

{% for tag in page.tags %}
  <code><a href="/tags?id={{tag}}">{{ tag }}</a></code>
{% endfor %}

<br/><br/><br/>

{{ content }}

<br/>
<br/>
<hr/>
{%include comments.html %}