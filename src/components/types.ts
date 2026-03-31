export interface StoredImage {
    src: string;
    gcsPath: string;
    alt?: string;
}

export interface CaseQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    feedback: string;
}
