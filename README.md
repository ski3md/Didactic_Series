# Pathology Learning Module: Granulomatous Diseases of the Lung

This is an interactive, all-inclusive didactic educational experience for pathology residents on granulomatous diseases of the lung. The module is built using the ADDIE model of instructional design, providing not only a learning experience on the topic but also a meta-narrative on how the module itself was constructed.

## Key Features

-   **Interactive Case Studies**: Explore clinical scenarios with integrated Whole Slide Imaging (WSI) powered by OpenSeadragon.
-   **AI-Powered Case Generator**: Leverage the Google Gemini API to generate unique, board-style case studies on demand and receive instant, AI-driven feedback on your diagnostic reasoning.
-   **Comprehensive Diagnostic Pathway**: A multi-step guided workflow that simulates the diagnostic process for a wide range of granulomatous diseases, from common to rare.
-   **Visual Discrimination Challenges**: Sharpen your eye for subtle morphologic differences with side-by-side WSI comparisons.
-   **Instructional Design Meta-Narrative**: Learn about the ADDIE model (Analysis, Design, Development, Evaluation) through dedicated sections that explain the pedagogical principles behind the module's creation.
-   **Responsive Design**: Fully accessible on both desktop and mobile devices.

## Tech Stack

-   **Frontend**: [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **AI**: [Google Gemini API](https://ai.google.dev/docs)
-   **Whole Slide Imaging**: [OpenSeadragon](https://openseadragon.github.io/)
-   **Build/Dev**: No build step needed; runs directly in the browser using ES modules and import maps.

## Getting Started

This project is designed to be run in an environment that supports modern web standards and can provide environment variables.

### Prerequisites

You will need a Google Gemini API Key to use the "AI Case Generator" feature.

### Configuration

1.  If running locally or in an environment that supports it, create a `.env` file in the root of the project.
2.  Add your API key to the `.env` file:
    ```
    API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```
3.  Serve the `index.html` file using a simple local web server.

### Running the App

Since this project uses ES modules and an import map directly in `index.html`, there is no complex build step required. You can serve the project directory with any static file server. For example, using Python:

```bash
python -m http.server
```

Then, open your browser to `http://localhost:8000`.

## Project Structure

-   `index.html`: The main entry point of the application.
-   `index.tsx`: The main React render script.
-   `App.tsx`: The root component that handles navigation and layout.
-   `components/`: Contains all the React components.
    -   `Sidebar.tsx`: The main navigation component.
    -   `Home.tsx`, `JobAid.tsx`, etc.: Components for each section of the learning module.
    -   `AnalysisPhase.tsx`, `DesignPhase.tsx`, etc.: Components explaining the ADDIE model.
    -   `WSIViewer.tsx`: The reusable OpenSeadragon component for viewing whole slide images.
    -   `AICaseGenerator.tsx`: The component that interacts with the Gemini API.
-   `types.ts`: TypeScript type definitions used across the application.