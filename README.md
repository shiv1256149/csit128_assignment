# Veyra Technologies — Company Profile Web Application

CSIT128 _Introduction to Web Technology_ — Assignment 2.
A company-profile web application for the fictional cloud provider **Veyra Technologies**,
built with HTML, CSS, JavaScript, Node.js (Express) and a JSON data store, plus an
XML + XSLT newsroom.

## Requirements

- Node.js 18 or newer

## How to run

```bash
npm install      # installs Express
npm start        # starts the server on http://localhost:3000
```

Then open <http://localhost:3000> in a browser.

## Project structure

```
veyra-website/
├── server.js                 # Node/Express server + REST API
├── package.json
├── data/
│   ├── company.json          # the "database": company, services, awards, etc.
│   └── comments.json         # visitor comments (written to by the API)
└── public/                   # static front end (served by Express)
    ├── index.html            # Home  (hero, stats, office image map)
    ├── about.html            # About (history + timeline table + awards table)
    ├── services.html         # Services (loaded from JSON)
    ├── team.html             # Team & founders (loaded from JSON)
    ├── feedback.html         # Testimonials + validated comment form + comments
    ├── news.html             # News (XML transformed by XSLT)
    ├── css/styles.css        # single external stylesheet
    ├── js/
    │   ├── main.js           # nav, active link, footer year
    │   ├── data-loader.js    # fetches the API and renders content
    │   └── validation.js     # comment-form validation + submission
    ├── data/
    │   ├── news.xml          # press releases (XML)
    │   └── news.xsl          # XSLT stylesheet for the newsroom
    └── images/               # logo, hero art, world map (image map)
```

## API endpoints

| Method | Path                | Purpose                                 |
| ------ | ------------------- | --------------------------------------- |
| GET    | `/api/company`      | Company profile, stats and offices      |
| GET    | `/api/timeline`     | Five-year milestone timeline            |
| GET    | `/api/services`     | Products and services                   |
| GET    | `/api/awards`       | Awards and certifications               |
| GET    | `/api/testimonials` | Customer testimonials                   |
| GET    | `/api/team`         | Founders and staff                      |
| GET    | `/api/comments`     | Visitor comments (newest first)         |
| POST   | `/api/comments`     | Submit a comment (validated, persisted) |
