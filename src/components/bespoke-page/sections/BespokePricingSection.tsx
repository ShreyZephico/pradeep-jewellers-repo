import { BESPOKE_PRICING_ROWS } from "../content";

export default function BespokePricingSection() {
  return (
    <section
      className="bespoke-page__section"
      aria-labelledby="bespoke-pricing-title"
    >
      <div className="bespoke-page__container">
        <p className="bespoke-page__eyebrow" data-reveal>
          Pricing
        </p>
        <h2 id="bespoke-pricing-title" className="bespoke-page__title" data-reveal>
          Transparent starting prices
        </h2>
        <p className="bespoke-page__lead" data-reveal>
          Indicative ranges — final quote depends on metal weight, stones, and complexity.
        </p>
        <div className="bespoke-pricing__wrap" data-reveal>
          <table className="bespoke-pricing__table">
            <thead>
              <tr>
                <th scope="col">Design type</th>
                <th scope="col">Metal</th>
                <th scope="col">Starting price</th>
              </tr>
            </thead>
            <tbody>
              {BESPOKE_PRICING_ROWS.map((row) => (
                <tr key={row.type}>
                  <td>{row.type}</td>
                  <td>{row.metal}</td>
                  <td>{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="bespoke-pricing__note" data-reveal>
          Final price depends on metal weight, gemstones, and design complexity. We share a full
          breakdown before you approve.
        </p>
      </div>
    </section>
  );
}
