import styles from "./css/TestimonialSection.module.css";

const testimonials = [
  {
    name: "Riya Mehta",
    detail: "Bridal client",
    quote:
      "The finish felt so premium, and the team helped me choose a ring that looked delicate but still felt special enough for my wedding events.",
  },
  {
    name: "Aarav Shah",
    detail: "Gift shopper",
    quote:
      "Packaging, delivery, and polish were all excellent. It felt like gifting something truly luxurious, not just another online purchase.",
  },
  {
    name: "Naina Kapoor",
    detail: "Repeat buyer",
    quote:
      "The designs have that rare mix of elegance and modern styling. I came back because the first piece still looks beautiful after regular wear.",
  },
];

export default function TestimonialSection() {
  return (
    <section id="testimonials" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Testimonials</p>
          <h2 className={styles.title}>Words that help new customers trust faster.</h2>
        </div>

        <div className={styles.grid}>
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className={styles.card}>
              <div className={styles.stars}>★★★★★</div>
              <p className={styles.quote}>&ldquo;{testimonial.quote}&rdquo;</p>
              <div className={styles.author}>
                <strong>{testimonial.name}</strong>
                <span>{testimonial.detail}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
