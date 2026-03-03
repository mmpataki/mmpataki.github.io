---
layout: page
title: about me
permalink: /about/
---

<style>
  .hire-page {
    --hire-ink: #163247;
    --hire-border: #d8e2e8;
    --hire-text: #223f50;
    font-size: 0.98rem;
    line-height: 1.68;
    color: var(--hire-text);
  }

  .hire-page * {
    box-sizing: border-box;
  }

  .hire-opportunity {
    background: linear-gradient(135deg, #e6f8f4 0%, #fff4ea 100%);
    border: 1px solid var(--hire-border);
    border-radius: 14px;
    padding: 16px 16px;
    margin: 12px 0 22px 0;
    animation: rise-fade 0.5s ease both;
  }

  .hire-opportunity strong {
    display: block;
    margin: 0 0 6px 0;
    color: var(--hire-ink);
    font-size: 1.02rem;
  }

  .hire-opportunity p {
    margin: 0 0 8px 0;
    max-width: 65ch;
    font-size: 0.92em;
  }

  .hire-opportunity .op-resume {
    margin-top: 8px;
  }

  .op-resume-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.88em;
    color: #3f6072;
    text-decoration: none;
    border-bottom: 1px dashed #a9bdc8;
    line-height: 1.2;
  }

  .op-resume-link .fa {
    font-size: 0.86em;
  }

  .op-resume-link:hover {
    color: var(--hire-ink);
    border-bottom-color: #7f9ba9;
  }

  .profile-links {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .profile-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border: 1px solid var(--hire-border);
    border-radius: 8px;
    text-decoration: none;
    color: #345467;
    background: #f7fbfd;
    font-size: 0.84em;
    line-height: 1.2;
  }

  .profile-link .fa {
    font-size: 0.88em;
    opacity: 0.9;
  }

  .profile-link:hover {
    color: var(--hire-ink);
    border-color: #afc5d1;
    background: #f2f8fb;
  }

  .hire-section {
    margin: 36px 0;
    animation: rise-fade 0.5s ease both;
  }

  .hire-section h2 {
    margin: 0 0 14px 0;
    color: var(--hire-ink);
    font-size: 1.36rem;
    line-height: 1.3;
  }

  .projects-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .project-row {
    padding: 0 0 16px 0;
    border-bottom: 1px solid var(--hire-border);
  }

  .project-row:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  .project-row h3 {
    margin: 0;
    font-size: 1rem;
    line-height: 1.35;
    color: var(--hire-ink);
    font-weight: 700;
  }

  .project-row p {
    margin: 8px 0 10px 0;
    font-size: 0.9em;
    line-height: 1.62;
  }

  .project-head {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    flex-wrap: wrap;
  }

  .project-head-links {
    font-size: 0.76em;
    text-transform: lowercase;
    letter-spacing: 0.1px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .project-head-links a {
    white-space: nowrap;
  }

  .project-head-links .fa {
    font-size: 0.9em;
    margin-left: 3px;
  }

  .project-head-note {
    color: #4e6878;
    font-size: 0.94em;
  }

  .project-stack {
    font-size: 0.8em;
    color: #3f6276;
    margin: 4px 0 2px 0;
  }

  .project-points {
    margin: 0;
    padding-left: 18px;
  }

  .project-points li {
    margin: 6px 0;
  }

  .hire-page ul {
    margin: 0;
    padding-left: 18px;
  }

  .hire-page li {
    margin: 4px 0;
  }

  @keyframes rise-fade {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    .hire-opportunity {
      padding: 16px 14px;
    }

    .hire-section {
      margin: 24px 0;
    }
  }
</style>

<script src="https://use.fontawesome.com/104ccf5067.js"></script>

<div class="hire-page">
  <section class="hire-opportunity">
    <strong>Open to engineering opportunities</strong>
    <p>I am best suited for backend/platform roles where I can combine systems design, production troubleshooting, and performance tuning.</p>
    <!-- <div class="op-resume">
      <a class="op-resume-link" href="/madhusoodan_pataki_2026_resume.pdf" target="_blank" rel="noopener"><i class="fa fa-file-text-o" aria-hidden="true"></i><span>resume</span></a>
    </div> -->
  </section>

  <section class="hire-section">
    <h2>Profile</h2>
    <p>I am an engineer at Salesforce. I enjoy problem-solving, programming, and exploring systems in depth.</p>
    <p>Most of my work sits at the intersection of distributed systems and performance engineering: debugging production issues, analyzing runtime behavior, and building practical tooling.</p>
    <div class="profile-links">
      <a class="profile-link" href="https://www.linkedin.com/in/madhusoodan-pataki/" target="_blank" rel="noopener"><i class="fa fa-linkedin" aria-hidden="true"></i><span>linkedin</span></a>
      <a class="profile-link" href="https://x.com/mmpataki" target="_blank" rel="noopener"><i class="fa fa-twitter" aria-hidden="true"></i><span>x</span></a>
      <a class="profile-link" href="https://github.com/mmpataki" target="_blank" rel="noopener"><i class="fa fa-github" aria-hidden="true"></i><span>github</span></a>
      <a class="profile-link" href="mailto:akshayapataki123@gmail.com"><i class="fa fa-envelope" aria-hidden="true"></i><span>email</span></a>
    </div>
  </section>

  <section class="hire-section">
    <h2>Interests</h2>
    <ul>
      <li>Deep Learning (just started)</li>
      <li>Distributed Systems</li>
      <li>Operating system (Linux)</li>
      <li>Programming Languages</li>
      <li>Datastructures and Algorithms</li>
      <li>Cybersecurity (I enjoy doing CTF challenges)</li>
    </ul>
  </section>

  <section class="hire-section">
    <h2>Featured Projects</h2>
    <p>For the complete list, see <a href="/full-work/">full work</a>.</p>
    <div class="projects-list">
      <div class="project-row">
        <div class="project-head">
          <h3>CAR</h3>
          <div class="project-head-links">
            <a href="https://github.com/mmpataki/car" target="_blank" rel="noopener">github <i class="fa fa-external-link" aria-hidden="true"></i></a>
          </div>
        </div>
        <div class="project-stack">Tech: Vue, Java, JavaScript, HTML, Docker</div>
        <p>Distributed log processing and visualization platform. A production fork is used by roughly 1K internal users.</p>
        <ul class="project-points">
          <li>Customizable analysis dashboards for troubleshooting.</li>
          <li>Regex-chain based parsing optimized with re2j.</li>
          <li>Event pipeline to gather and correlate logs from distributed services.</li>
        </ul>
      </div>

      <div class="project-row">
        <div class="project-head">
          <h3>SDFS</h3>
          <div class="project-head-links">
            <a href="https://github.com/mmpataki/sdfs" target="_blank" rel="noopener">github <i class="fa fa-external-link" aria-hidden="true"></i></a>
          </div>
        </div>
        <div class="project-stack">Tech: Java, JavaScript, HTML, CSS, Docker</div>
        <p>Lightweight distributed filesystem and orchestration layer designed with simple APIs and easy deployment in mind.</p>
        <ul class="project-points">
          <li>Used on ~70 KVM-based nodes for cooperative resource sharing.</li>
          <li>Prioritized practical deployability over full fault-tolerance complexity.</li>
        </ul>
      </div>

      <div class="project-row">
        <div class="project-head">
          <h3>Probes</h3>
          <div class="project-head-links">
            <a href="https://github.com/mmpataki/probes" target="_blank" rel="noopener">github <i class="fa fa-external-link" aria-hidden="true"></i></a>
          </div>
        </div>
        <div class="project-stack">Tech: Java, HTML, JavaScript, CSS, Shell</div>
        <p>Low-code scripting environment for support engineers to build debugging and collection workflows without writing full programs.</p>
        <ul class="project-points">
          <li>Program flow is composed from UI blocks.</li>
          <li>Improved turnaround for creating internal diagnostics tooling.</li>
        </ul>
      </div>

      <div class="project-row">
        <div class="project-head">
          <h3>ladybug</h3>
          <div class="project-head-links">
            <span class="project-head-note">internal browser extension</span>
          </div>
        </div>
        <div class="project-stack">Tech: JavaScript, HTML, CSS, browser APIs, internal REST APIs</div>
        <p>Internal browser extension to collect diagnostic context in a few clicks and speed up production troubleshooting workflows.</p>
        <ul class="project-points">
          <li>Used across product teams with over 2M API calls per month.</li>
          <li>Adopted by roughly 1K users for faster issue triage and support handoffs.</li>
        </ul>
      </div>

    </div>
  </section>
</div>
