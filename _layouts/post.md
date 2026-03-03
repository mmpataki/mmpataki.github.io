---
layout: default
---

<script src="https://use.fontawesome.com/104ccf5067.js"></script>
{% include ga.html %}

<style>
  details.post-outline.collapsable {
    margin: 18px 0 22px;
    border-color: rgba(15, 23, 42, 0.08);
    --collapsable-splash-opacity: 0.52;
    --collapsable-splash-c1: 251, 191, 36;
    --collapsable-splash-c2: 251, 146, 60;
    --collapsable-splash-c3: 253, 186, 116;
  }

  [data-theme="dark"] details.post-outline.collapsable {
    border-color: rgba(148, 163, 184, 0.2);
  }

  details.post-outline.collapsable::before {
    display: none;
  }

  details.post-outline.collapsable::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    border-radius: inherit;
    box-shadow:
      0 0 0 1px rgba(251, 146, 60, 0.08),
      0 0 0 3px rgba(251, 191, 36, 0.025),
      0 10px 20px -20px rgba(251, 146, 60, 0.22),
      0 -2px 10px -12px rgba(253, 186, 116, 0.18);
  }

  [data-theme="dark"] details.post-outline.collapsable::after {
    box-shadow:
      0 0 0 1px rgba(251, 146, 60, 0.12),
      0 0 0 3px rgba(251, 191, 36, 0.04),
      0 10px 20px -20px rgba(251, 146, 60, 0.2),
      0 -2px 10px -12px rgba(253, 186, 116, 0.14);
  }

  .post-outline-title {
    margin: 0;
    font-size: 0.95rem;
    letter-spacing: 0.02em;
  }

  .post-outline-list {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px dashed rgba(15, 23, 42, 0.2);
  }

  [data-theme="dark"] .post-outline-list {
    border-top-color: rgba(148, 163, 184, 0.28);
  }

  .post-outline-list li {
    margin: 4px 0;
    position: relative;
    padding-left: 12px;
  }

  .post-outline-list li::before {
    content: "-";
    position: absolute;
    left: 0;
    opacity: 0.8;
  }

  .post-outline-list .outline-level-3 {
    margin-left: 22px;
  }

  .post-outline-list .outline-level-4 {
    margin-left: 44px;
  }

  .post-outline-list a {
    text-decoration: none;
  }

  .post-outline-list a:hover {
    text-decoration: underline;
  }
</style>

<h1 style="margin-top: 0px"> {{ page.title }} </h1>

<i class="fa fa-clock-o" aria-hidden="true"></i>
&nbsp;
<span class="readtime">
	{% if post %}
		{% assign words = post.content | number_of_words %}
		{% if words < 360 %}
		1 min read
		{% else %}
		{{ words | divided_by:180 | plus:2 }} mins read
		{% endif %}
	{% else %}
		{% assign words = content | number_of_words %}
		{% if words < 360 %}
		1 min read
		{% else %}
		{{ words | divided_by:180 | plus:2 }} mins read
		{% endif %}
	{% endif %}
</span>

<br/>

<i class="fa fa-calendar" aria-hidden="true"></i>  &nbsp;
<span class="postpage-date">{{ page.date | date: '%B %d, %Y' }}</span>

<br/>

<i class="fa fa-tags" aria-hidden="true"></i> &nbsp;
{% for tag in page.tags %}
  <code class="postpage-tag"><a href="/archive?id={{tag}}">{{ tag }}</a></code>
{% endfor %}


<br/><br/><br/>

<details id="post-outline" class="collapsable post-outline" style="display:none;">
  <summary>
    <span class="post-outline-title">Outline</span>
  </summary>
  <div>
    <ul id="post-outline-list" class="post-outline-list"></ul>
  </div>
</details>

<div id="post-content">
  {{ content }}
</div>

<br/>
<br/>
<!--mathjax-->
<script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

<!--mermaid js-->
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>
<script>
  (function () {
    var container = document.getElementById("post-content");
    var outline = document.getElementById("post-outline");
    var outlineList = document.getElementById("post-outline-list");

    if (!container || !outline || !outlineList) {
      return;
    }

    var headings = Array.prototype.slice.call(
      container.querySelectorAll("h2, h3, h4")
    ).filter(function (heading) {
      return heading.textContent && heading.textContent.trim().length > 0;
    });

    if (headings.length > 0) {
      var placeholder = container.querySelector(
        "[data-post-outline-placeholder], .post-outline-placeholder"
      );
      if (placeholder) {
        placeholder.replaceWith(outline);
      }

      var usedIds = {};
      var slugify = function (value) {
        return value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
      };

      headings.forEach(function (heading, index) {
        var baseId = heading.id || slugify(heading.textContent) || ("section-" + (index + 1));
        var uniqueId = baseId;
        var suffix = 2;
        while (usedIds[uniqueId]) {
          uniqueId = baseId + "-" + suffix;
          suffix += 1;
        }
        usedIds[uniqueId] = true;
        heading.id = uniqueId;

        var level = parseInt(heading.tagName.slice(1), 10);
        var li = document.createElement("li");
        li.className = "outline-level-" + level;

        var a = document.createElement("a");
        a.href = "#" + uniqueId;
        a.textContent = heading.textContent.trim();
        li.appendChild(a);
        outlineList.appendChild(li);
      });

      outline.style.display = "block";
    }

    var quoteAliases = {
      note: "note",
      info: "sky",
      sky: "sky",
      warm: "warm",
      tip: "mint",
      mint: "mint",
      warn: "rose",
      caution: "rose",
      rose: "rose"
    };
    Array.prototype.forEach.call(
      container.querySelectorAll("blockquote"),
      function (quote) {
        var firstParagraph = quote.querySelector("p");
        if (!firstParagraph || !firstParagraph.textContent) {
          return;
        }

        var marker = firstParagraph.textContent.trim().match(
          /^\[!([a-zA-Z0-9_-]+)\](?:\s+(.*))?$/
        );
        if (!marker) {
          return;
        }

        var alias = (marker[1] || "").toLowerCase();
        var variant = quoteAliases[alias] || "note";
        var title = (marker[2] || "").trim();

        quote.classList.add("quote-" + variant);

        if (title) {
          firstParagraph.textContent = title;
          firstParagraph.classList.add("quote-title");
        } else {
          firstParagraph.remove();
        }
      }
    );
  })();
</script>

<center>
{% include share-buttons.html %}
</center>
<hr/>
{%include comments.html %}

<link rel="stylesheet" href="/js/lightdark/styles.css">
