# Changelog
All notable changes to the **Readme Creator** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.1.4] - 2025-09-10
### Fixed
- **Preview README** command is now consistently available for all Markdown files (`*.md`), not just for `README.md`.

### Changed
- Cleaned up duplicate `readmeGenerator.preview` entries in the Command Palette contributions.
- Improved command visibility rules for a more predictable user experience.

## [1.1.3] - 2025-08-11
### Changed
- Updated formatting of the prompt template for improved readability.

## [1.1.2] - 2025-08-10
### Changed
- Improved prompt template to provide clearer installation instructions.

## [1.1.1] - 2025-08-09
### Changed
- Changed project license from a custom personal license to the MIT License.
- Updated `README.md` to reflect new licensing terms.

## [1.1.0] - 2025-07-14
### Added
- Automatically includes `.gitignore` entries when generating folder structures.
- Updated input placeholder text to clarify that `.gitignore` files are ignored by default.

## [1.0.3] - 2025-07-01
### Fixed
- `.env` file was not being loaded from the workspace root. Now resolved.

## [1.0.2] - 2025-06-30
### Changed
- Updated extension `README.md` with clearer installation and usage instructions.

## [1.0.1] - 2025-06-30
### Removed
- Removed unused `readmeGenerator.maxDepth` setting.
### Changed
- Minor internal refactoring and code cleanup.

## [1.0.0] - 2025-06-30
### Added
- Initial release of the Readme Creator extension.
- AI-powered README generation using Groq API.
- Support for customizable prompts and folder structure inclusion.
- Commands for generating, previewing, and configuring README files.
