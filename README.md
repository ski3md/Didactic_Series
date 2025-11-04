# Pathology Learning Module: Granulomatous Diseases of the Lung

This is an interactive, all-inclusive didactic educational experience for pathology residents on granulomatous diseases of the lung. The module is built using the ADDIE model of instructional design, providing not only a learning experience on the topic but also a meta-narrative on how the module itself was constructed.

This project has been configured with Vite for a modern, fast development experience and easy deployment.

## Key Features

-   **Interactive Case Studies**: Explore clinical scenarios with integrated Whole Slide Imaging (WSI) powered by OpenSeadragon.
-   **AI-Powered Case Generator**: Leverage the Google Gemini API to generate unique, board-style case studies on demand and receive instant, AI-driven feedback on your diagnostic reasoning.
-   **Comprehensive Diagnostic Pathway**: A multi-step guided workflow that simulates the diagnostic process for a wide range of granulomatous diseases, from common to rare.
-   **Visual Discrimination Challenges**: Sharpen your eye for subtle morphologic differences with side-by-side WSI comparisons.
-   **Instructional Design Meta-Narrative**: Learn about the ADDIE model (Analysis, Design, Development, Evaluation) through dedicated sections that explain the pedagogical principles behind the module's creation.
-   **Responsive Design**: Fully accessible on both desktop and mobile devices.

## Tech Stack

-   **Framework**: [React](https://reactjs.org/) with [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **AI**: [Google Gemini API](https://ai.google.dev/docs)
-   **Whole Slide Imaging**: [OpenSeadragon](https://openseadragon.github.io/)
-   **Backend (Demonstrated)**: A mock API using browser storage ([IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)) to provide a fully offline, standalone experience.
-   **Backend (Instructional Goal)**: The module includes complete code and instructions for deploying a persistent, multi-user backend using [Google Cloud Functions](https://cloud.google.com/functions), [Cloud Storage](https://cloud.google.com/storage), and [Firestore](https://cloud.google.com/firestore).

---

## Getting Started

Follow these instructions to get the project running locally and to deploy it.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/pathology-learning-module.git
cd pathology-learning-module
```

### 2. Install Dependencies

You will need [Node.js](https://nodejs.org/) installed. Then, run:
```bash
npm install
```

### 3. Configure Environment Variables

The application requires a Google Gemini API Key for its AI features.

1.  Create a new file named `.env` in the root of the project. (You can copy `.env.example`).
2.  Add your API key to this file.

    ```env
    API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```

    _Note: The `.env` file is listed in `.gitignore` and should not be committed to your repository._

### 4. Run the Development Server

```bash
npm run dev
```

This will start the Vite development server. Open your browser to the local address provided (usually `http://localhost:5173`).

---

## Image Storage Architecture (Instructional Blueprint)

This application is designed to be backed by a robust, scalable, and persistent system for image management, powered by Google Cloud services. **For this standalone educational module, this backend is simulated using a mock API that stores data in your browser's local database.** The code and instructions below describe the target architecture that you can deploy yourself.

-   **Persistent Storage**: Image files are stored securely in a private **Google Cloud Storage (GCS)** bucket.
-   **Metadata Database**: All information about the images (titles, descriptions, tags, GCS paths) is stored in a **Firestore** collection.
-   **Secure Backend API**: A set of **Google Cloud Functions** provides secure HTTP endpoints for the frontend to manage images.
-   **Workflow**: Users upload images directly to GCS via secure signed URLs. The frontend then notifies the backend to save the metadata to Firestore.

_For full implementation details and backend code, see the `metadata.json` file._

---

## Deployment to GitHub Pages

This project is pre-configured for easy deployment to GitHub Pages.

### 1. Update Project Configuration

Before deploying, you need to set the correct repository name.

-   **In `package.json`**: Update the `homepage` field to point to your GitHub Pages URL.
    ```json
    "homepage": "https://your-username.github.io/pathology-learning-module",
    ```
-   **In `vite.config.ts`**: Update the `base` property to match your repository name.
    ```ts
    // ...
    base: '/pathology-learning-module/',
    // ...
    ```
    (This has been pre-filled. Change it if your repo name is different.)

### 2. Deploy

The project includes the `gh-pages` package to simplify deployment. When you run the deploy script, it will use the environment variables from your local `.env` file and embed them in the static files.

**Important**: For a public repository, be aware that the `API_KEY` will be visible in the built JavaScript files. For personal or private use, this may be acceptable. For a truly secure public deployment, you would need to implement a server-side component to proxy API requests or use a more advanced authentication mechanism, which is beyond the scope of a static site deployment.

Run the following command to deploy:

```bash
npm run deploy
```

This command will first build the project into a `dist` folder and then push the contents of that folder to a special `gh-pages` branch on your repository.

### 3. Configure GitHub Pages

1.  In your GitHub repository, go to **Settings > Pages**.
2.  Under **Build and deployment**, set the **Source** to **Deploy from a branch**.
3.  Set the **Branch** to `gh-pages` and the folder to `/ (root)`.
4.  Click **Save**.

Your site should be live at the URL specified in your `homepage` field within a few minutes.