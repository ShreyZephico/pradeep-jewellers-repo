import Image from "next/image";
import styles from "./css/ShopByCategorySection.module.css";

const categories = [
  {
    title: "Engagement Rings",
    text: "Statement silhouettes and delicate sparkle for milestone moments.",
    image: "/products/ring-1.png",
  },
  {
    title: "Bridal Bands",
    text: "Classic bands with refined detailing for everyday luxury.",
    image: "/products/ring-4.png",
  },
  {
    title: "Signature Icons",
    text: "Modern pieces designed to anchor your jewellery wardrobe.",
    image: "/products/ring-5.png",
  },
];

export default function ShopByCategorySection() {
  return (
    <section id="collections" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Shop by collection</p>
          <h2 className={styles.title}>Curated categories for every story.</h2>
          <p className={styles.text}>
            Build the landing page around the collections you want shoppers to
            discover first.
          </p>
        </div>

        <div className={styles.grid}>
          {categories.map((category) => (
            <article key={category.title} className={styles.card}>
              <div className={styles.imageWrap}>
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  className={styles.image}
                />
              </div>
              <div className={styles.content}>
                <h3>{category.title}</h3>
                <p>{category.text}</p>
                <a href="#featured-products" className={styles.link}>
                  Shop Collection
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
