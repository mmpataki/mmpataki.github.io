---
title: Tags
permalink: /tags/
---

<style>
  code {
    cursor: pointer;
  }
</style>

<div id="tagcloud">
</div>

<br/>

<div id="selectedtags"></div>
<br/>
<ul id="selectedurls"></ul>

<script>
  var tags = {
    {% assign firstTag = true %}
    {% for tag in site.tags %}
        {% if firstTag == false %},{% endif %}
        {% assign firstTag = false %}
        "{{tag[0]}}": {
          selected: false,
          pages: [
            {% assign firstPage = true %}
            {% for post in tag[1] %}
              {% if firstPage == false %},{% endif %}
              {% assign firstPage = false %}
              {
                url: "{{post.url}}",
                title: "{{post.title}}"
              }
            {% endfor %}
          ]
        }
    {% endfor %}
  };

  /* from the URL */
  try {
    var selectedTags = new URL(location).searchParams.get("id").split(",");
    for(selectedTag in selectedTags) {
      var tag = selectedTags[selectedTag]
      if (tag in tags) {
        tags[tag].selected = true
      }
    }
  } catch {

  }

  renderTags();

  function renderTags() {
    showTags();
    showUrls();
  }
  
  function tagClicked(tag) {
    tag = tags[tag]
    tag.selected = !tag.selected;
    renderTags();
  }

  function showUrls() {

    let selTags = [];
    let urls = new Set();

    var selectedtags = document.getElementById("selectedtags");
    selectedtags.innerHTML = "";
    var selectedurls = document.getElementById("selectedurls");
    selectedurls.innerHTML = "";

    var firstTag = true;
    for(tagName in tags) {
      var tag = tags[tagName]
      if(tag.selected) {
        selectedtags.innerHTML += `<code style="background-color: lightgreen">${tagName}</code>`;
        if(firstTag) {
          for (i in tag.pages) 
            urls.add(tag.pages[i])
          firstTag = false;
        } else {
          urls = new Set(tag.pages.filter(
            function (u) {
              var ua = [...urls];
              for(ou in ua) {
                if(ua[ou].url == u.url)
                  return true;
              }
            }
          ));
        }
      }
    }

    urls.forEach(u => selectedurls.innerHTML += `<li><a href="${u.url}">${u.title}</a></li>`)
  }

  /* show tag cloud */
  function showTags() {
    document.getElementById("tagcloud").innerHTML = "";
    for(tag in tags) {
      var pages = tags[tag].pages;
      document.getElementById("tagcloud").innerHTML += `
        <code style="background-color: ${tags[tag].selected ? "skyblue": "defcol"}; font-size: ${12 + 4 * pages.length}px;" title="${pages.length} post${pages.length > 1 ? "s":""}" onclick="tagClicked('${tag}')">${tag}</code>
      `;
    }
  }

</script>