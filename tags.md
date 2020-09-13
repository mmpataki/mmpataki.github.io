---
title: Archive
permalink: /archive/
---

<style>
  code {
    cursor: pointer;
  }
  .date {
    color: gray;
    font-size: 0.9em;
  }
</style>

<div id="tagcloud">
</div>

<br/>

<div id="selectedtags"></div>
<br/>
<ol style="list-style-type: none;" id="selectedurls"></ol>

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
                title: "{{post.title}}",
                pdate: "{{post.date}}"
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

  function getBlogPeriod(d) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    d = new Date(Date.parse(d.split(" ")[0]));
    return `${monthNames[d.getMonth()]}, ${d.getFullYear()}`
  }

  function showUrls() {

    let selTags = [];
    let urls = new Set();

    /* if no tag is selected, we should show all of them */
    let tmp = {};
    for(tagName in tags) {
      tags[tagName].pages.forEach(page => tmp[page.url] = page)
    }
    Object.values(tmp).forEach(p => urls.add(p))

    var selectedtags = document.getElementById("selectedtags");
    selectedtags.innerHTML = "";
    var selectedurls = document.getElementById("selectedurls");
    selectedurls.innerHTML = "";

    for(tagName in tags) {
      var tag = tags[tagName]
      if(tag.selected) {
        selectedtags.innerHTML += `<code style="background-color: lightgreen">${tagName}</code> `;
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

    let html = "", lastDate = "";
    [...urls]
      .sort((u1, u2) => toDate(u1.pdate) < toDate(u2.pdate))
      .forEach(u => {
        console.log(toDate(u.pdate))
        if(getBlogPeriod(lastDate) != getBlogPeriod(u.pdate)) {
          html += `${lastDate == "" ? "" : "<br/></ul>"}<li><i class="date">${getBlogPeriod(u.pdate)}</i><ul style="list-style-type: none;">`
        }
        html += `<li><a href="${u.url}">${u.title}</a></li>`
        lastDate = u.pdate
      }
    );

    selectedurls.innerHTML = html
  }

  function toDate(u) {
    return new Date(Date.parse(`${u.split(" ")[0]} ${u.split(" ")[1]}`))
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
