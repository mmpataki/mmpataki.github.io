---
title: Adding a tag cloud page to jekyll blog
tags: blogging hack jekyll javascript
---

Hmm... you have created a jekyll based blog and moved / added content to it? You notice there is no tags page in the default theme like in Blogger? Here is a simple solution to add them

1. Add a tags frontmatter to all your posts
	```markdown
	---
	title: My first blogpost
	tags: hack java datastructures
	...
	---
	This is some content in your post. Lorem ipsum dolor ...
	```

2. The above template will add tags (with hyperlink to a tag cloud page) in to your posts page.

3. Now, it's time to create a tag page, which will have a list of all tags along with the posts who are tagged with these tags.

4. We will also use some javascript to add some interactivity to this page. (When user selects [a] tag[s], the associated posts will be shown below)

5. To supply these tags metadata to javascript, we will generate a JSON database in the same page using the liquid templating.

6. Create a page called tags.md in the root directory of the site and paste the content you find [here](https://raw.githubusercontent.com/mmpataki/mmpataki.github.io/master/tags.md)

7. To link posts to this tags page, add tags to your post page. We do this by editing the template for the posts page (so that we don't need to add links in every post we do). Create a directory called `_layouts` in your `site` directory and a file called `post.md` in that with below content. This will serve as template for your posts page so feel free to customize it.
	```markdown
	{%raw%}---
	layout: default
	---

	<h1> {{ page.title }} </h1>
	<i>{{ page.date | date: '%B %d, %Y' }}</i>

	<br/>

	{% for tag in page.tags %}
	<code><a href="/acrhive?id={{tag}}">{{ tag }}</a></code>
	{% endfor %}

	<br/><br/><br/>

	{{ content }}{%endraw%}
	```

8. We are done. For a demo, click on the above listed archive of this page.


<br/>
### Credits
Thanks to `Ozzie Liu` for a [nice blog](https://ozzieliu.com/2016/04/26/writing-liquid-template-in-markdown-with-jekyll) on escaping the liquid processing in a jekyll page