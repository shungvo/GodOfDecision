/**
 * Decision pillar.
 *
 * The book of the god of decision.
 * One short answer per question.
 */

export interface OracleAnswer {
    id: string;
    vi: string;
    en: string;
    type: string;
    tags: string[];
    emoji: string;
}

/**
 * Returned by POST /api/decision/draw
 *
 * The answer and nothing else. The interpretation is a second request
 * (POST /api/decision/interpret), because it costs a model call and
 * most readers are done once they have the answer.
 */
export interface OracleDraw {
    /** Null when the reader drew without asking anything. */
    question: string | null;
    answer: OracleAnswer;
}
