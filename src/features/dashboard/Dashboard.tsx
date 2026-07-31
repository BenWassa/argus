const topics = [
  { title: 'NATO phonetic alphabet', scope: '26 letters and their code words', progress: 92 },
  { title: 'OODA loop', scope: 'Four stages and their relationships', progress: 75 },
  { title: 'Primary survey', scope: 'ABCDE assessment sequence', progress: 40 },
]

export function Dashboard() {
  return (
    <>
      <section className="practice">
        <div>
          <p className="section-label">Ready to practice</p>
          <h1>Three topics are due.</h1>
          <p>Continue a short recall session and bank today’s work.</p>
        </div>
        <button type="button">Start practice</button>
      </section>

      <section aria-labelledby="library-heading">
        <div className="section-heading">
          <div>
            <h2 id="library-heading">Library</h2>
            <p>Finite topics with a clear edge.</p>
          </div>
          <button className="secondary" type="button">Add topic</button>
        </div>
        <div className="topic-list">
          {topics.map((topic) => (
            <article className="topic" key={topic.title}>
              <div>
                <h3>{topic.title}</h3>
                <p>{topic.scope}</p>
              </div>
              <span>{topic.progress}%</span>
              <div className="progress" aria-label={`${topic.progress}% retained`}>
                <span style={{ width: `${topic.progress}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
