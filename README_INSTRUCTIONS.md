Write README.md following these rules:

REQUIRED SECTIONS (in this order):
1. Title + one-line description (under 120 chars, no hype words)
2. Badges — shields.io, style=for-the-badge only. Include: stars, forks, issues, license, language/version. Then social/link badges wrapped in hyperlinks. All inside `<div align="center">`
3. Banner or screenshot — place directly under badges inside `<div align="center">`
4. Short "What is this?" paragraph — plain language, explain the problem it solves
5. Feature highlights — 3-column table: Icon+Category | Description | Link
6. Agent/feature directory — grouped by category, one table per group with columns: Name | Category | Description | Framework | Difficulty | Link. Difficulty = ⭐ Beginner / ⭐⭐ Intermediate / ⭐⭐⭐ Advanced
7. Featured deep dives — one subsection per major feature covering: problem solved, solution, feature bullet list, tech stack, estimated running cost
8. Repository structure — directory tree in a code block
9. Quick start — numbered steps with bash code blocks, must be runnable in under 30 seconds
10. Learning roadmap — Beginner / Intermediate / Advanced tiers with ✅ and 🔜 checkboxes
11. Tech stack — subsections: Core Frameworks, Backend & Data, Integrations, AI & ML
12. Comparison table — features as rows, agents/variants as columns, ✅ / ❌ values
13. Use cases & ROI — per agent: who it's for, time/cost saved, break-even
14. Contributing — where to ask questions, PR policy, link to issues
15. Connect & Support — inside `<div align="center">`, repeat key badges, email, website
16. Roadmap — current quarter ✅, next quarter 🔜, future 🔜
17. License — must be last section

FORMATTING RULES:
- Every H2 heading must start with a relevant emoji
- Separate major sections with `---`
- Use `<div align="center">` for badges, banner, footer
- Use tables instead of bullet lists wherever possible
- Keep table cell descriptions to one sentence
- All code blocks must have language tags (` ```bash `, ` ```python `, etc.)
- No bold inside table cells
- All links must be real and working

BADGE FORMAT:
- Repo stats: `https://img.shields.io/github/stars/{owner}/{repo}?style=for-the-badge&logo=github`
- Social: `https://img.shields.io/badge/{Label}-{Text}-{HexColor}?style=for-the-badge&logo={logoname}`
- Logo names from simpleicons.org. Common hex: LinkedIn=0A66C2, YouTube=FF0000, GitHub=181717

CONTENT STANDARDS:
- First 2 lines must answer: what is this and why should I care
- Visual proof (screenshot or GIF) must appear in the top third of the page
- Quick start must work in 3 commands or fewer
- Length target: 800–1500 words of prose (tables and code blocks don't count)
- No marketing language: avoid "powerful", "robust", "cutting-edge", "revolutionary"
- ROI claims must be specific and realistic
- No broken links — if a path is unknown, use a relative placeholder like `./docs/api.md`

BEFORE WRITING, ASK FOR:
- GitHub username and repo name
- Project name and tagline
- List of features/agents with descriptions
- Social links (LinkedIn, YouTube, etc.)
- Contact email and website
- License type
- Tech stack details
- Any screenshots or GIFs in the repo (list the paths)
