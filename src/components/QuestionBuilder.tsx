import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from './Icons'
import {
  CARD,
  FIELD,
  FIELD_HINT,
  FIELD_LABEL,
  MUTED_NOTE,
  PILL,
  PILL_IDLE,
  Q_ADD,
  Q_CARD,
  Q_CHOICE,
  Q_CHOICE_BOX,
  Q_CHOICE_DOT,
  Q_CHOICES,
  Q_HEAD,
  Q_NUMBER,
  Q_TOOL,
  Q_TOOLS,
  SET_ABOUT,
  SET_HEAD,
  SET_SECTION,
  SET_TITLE,
} from './ui'
import {
  QUESTION_LABEL,
  blankQuestion,
  type Question,
  type QuestionType,
} from '../lib/documents'

/**
 * Building the questions on a form.
 *
 * Question ids are never minted here. A new question goes up with an empty id
 * and the server fills one in, because an id chosen by a client could collide
 * with one that already has answers filed under it — and answers are keyed by
 * question id, so a collision silently merges two different questions.
 *
 * Reordering and deleting are the operations that need care for the same
 * reason. Moving a question does not touch its id, so the answers follow it;
 * deleting one leaves the answers filed under an id nothing asks any more,
 * which the submissions view labels rather than hides.
 */
export function QuestionBuilder({
  questions,
  onChange,
}: {
  questions: Question[]
  onChange: (questions: Question[]) => void
}) {
  function patch(index: number, changes: Partial<Question>) {
    onChange(
      questions.map((question, position) =>
        position === index ? { ...question, ...changes } : question,
      ),
    )
  }

  function move(index: number, by: number) {
    const target = index + by
    if (target < 0 || target >= questions.length) return

    const next = [...questions]
    const [lifted] = next.splice(index, 1)
    next.splice(target, 0, lifted)
    onChange(next)
  }

  function retype(index: number, type: QuestionType) {
    const question = questions[index]
    const wantsChoices = type === 'single_choice' || type === 'multi_choice'

    patch(index, {
      type,
      // Keep whatever choices exist when moving between the two choice types;
      // seed a pair when arriving from a text type with none.
      choices: wantsChoices
        ? question.choices.length > 0
          ? question.choices
          : ['', '']
        : [],
    })
  }

  return (
    <section className={CARD}>
      <div className={SET_SECTION}>
        <div className={SET_HEAD}>
          <div>
            <h3 className={SET_TITLE}>Questions</h3>
            <p className={SET_ABOUT}>
              Answers are filed against a question, not a position — so
              reordering and editing keep everything already collected.
            </p>
          </div>
        </div>

        {questions.length === 0 && (
          <p className={MUTED_NOTE} style={{ marginBottom: 14 }}>
            No questions yet. A form with none is a document that asks nothing.
          </p>
        )}

        <div className={Q_CHOICES} style={{ gap: 14 }}>
          {questions.map((question, index) => (
            <div key={question.id || `new-${index}`} className={Q_CARD}>
              <div className={Q_HEAD}>
                <span className={Q_NUMBER}>{index + 1}</span>

                <select
                  value={question.type}
                  aria-label="Answer type"
                  onChange={(event) =>
                    retype(index, event.target.value as QuestionType)
                  }
                >
                  {(Object.keys(QUESTION_LABEL) as QuestionType[]).map((type) => (
                    <option key={type} value={type}>
                      {QUESTION_LABEL[type]}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className={`${PILL} ${PILL_IDLE}`}
                  aria-pressed={question.required}
                  onClick={() => patch(index, { required: !question.required })}
                >
                  {question.required ? 'Required' : 'Optional'}
                </button>

                <span className={Q_TOOLS}>
                  <button
                    type="button"
                    className={Q_TOOL}
                    title="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUpIcon size={14} />
                  </button>
                  <button
                    type="button"
                    className={Q_TOOL}
                    title="Move down"
                    disabled={index === questions.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDownIcon size={14} />
                  </button>
                  <button
                    type="button"
                    className={Q_TOOL}
                    title="Remove"
                    onClick={() =>
                      onChange(questions.filter((_, position) => position !== index))
                    }
                  >
                    <TrashIcon size={14} />
                  </button>
                </span>
              </div>

              <label className={FIELD}>
                <span className={FIELD_LABEL}>Question</span>
                <input
                  value={question.prompt}
                  maxLength={500}
                  placeholder="What do you want to get out of coaching?"
                  onChange={(event) => patch(index, { prompt: event.target.value })}
                />
              </label>

              <label className={FIELD}>
                <span className={FIELD_LABEL}>Help text, optional</span>
                <input
                  value={question.helpText}
                  maxLength={300}
                  placeholder="Anything that makes the question easier to answer."
                  onChange={(event) => patch(index, { helpText: event.target.value })}
                />
              </label>

              {(question.type === 'single_choice' ||
                question.type === 'multi_choice') && (
                <div className={FIELD}>
                  <span className={FIELD_LABEL}>Choices</span>

                  <div className={Q_CHOICES}>
                    {question.choices.map((choice, position) => (
                      <div key={position} className={Q_CHOICE}>
                        <span
                          className={
                            question.type === 'single_choice'
                              ? Q_CHOICE_DOT
                              : Q_CHOICE_BOX
                          }
                          aria-hidden="true"
                        />
                        <input
                          value={choice}
                          maxLength={200}
                          placeholder={`Choice ${position + 1}`}
                          onChange={(event) =>
                            patch(index, {
                              choices: question.choices.map((entry, slot) =>
                                slot === position ? event.target.value : entry,
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          className={Q_TOOL}
                          title="Remove choice"
                          disabled={question.choices.length <= 2}
                          onClick={() =>
                            patch(index, {
                              choices: question.choices.filter(
                                (_, slot) => slot !== position,
                              ),
                            })
                          }
                        >
                          <TrashIcon size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={Q_ADD}
                    disabled={question.choices.length >= 12}
                    onClick={() =>
                      patch(index, { choices: [...question.choices, ''] })
                    }
                  >
                    Add a choice
                  </button>

                  <span className={FIELD_HINT}>
                    Empty choices are dropped when you save.
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          className={Q_ADD}
          style={{ marginTop: 14 }}
          disabled={questions.length >= 40}
          onClick={() => onChange([...questions, blankQuestion()])}
        >
          <PlusIcon size={14} />
          Add a question
        </button>
      </div>
    </section>
  )
}
