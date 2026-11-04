"use client";

import { StudentVideo, type TransformationStudent } from "./StudentVideo";
import styles from "./BeforeAfter.module.css";

// Add another entry here to render another student story.
// Optional originalDuration: "2:58" displays beside the actual MP4 duration.
const students: TransformationStudent[] = [
  {
    id: "jamsheer",
    studentName: "Jamsheer",
    profession: "Influencey English member",
    story:
      "Every speaking journey has a starting point. Watch Jamsheer?s speaking journey.",
    video: "/videos/students/before-after/jamsheer-after.mp4",
  },
  {
    id: "minha",
    studentName: "Minha",
    profession: "Influencey English member",
    story:
      "Every speaking journey has a starting point. Watch Minha?s speaking journey.",
    video: "/videos/students/before-after/minha-after.mp4",
  },
  {
    id: "noor",
    studentName: "Noor",
    profession: "Influencey English member",
    story:
      "Every speaking journey has a starting point. Watch Noor?s speaking journey.",
    video: "/videos/students/before-after/noor-after.mp4",
  },
];

export function BeforeAfter() {
  return (
    <section
      id="transformations"
      className={styles.section}
      aria-labelledby="transformations-heading"
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className="eyebrow">Student Transformations</p>
          <h2 id="transformations-heading">Real progress, real people</h2>
          <p className={styles.intro}>
            Hear from our community members and see how their English speaking
            confidence improved over time.
          </p>
        </header>
        <div className={styles.rows}>
          {students.map((student) => (
            <article
              className={styles.row}
              key={student.id}
              id={`student-${student.id}`}
              aria-labelledby={`${student.id}-name`}
            >
              <div className={styles.visual}>
                <StudentVideo student={student} />
              </div>
              <div className={styles.details}>
                <span className={styles.quote} aria-hidden="true">
                  “
                </span>
                <div>
                  <p className={styles.story}>{student.story}</p>
                  <h3 id={`${student.id}-name`}>{student.studentName}</h3>
                  <p className={styles.role}>{student.profession}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
