import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { NOTE_GROUP_BG, type NoteGroup } from "@/lib/notes";
import { getCollectionProducts } from "@/lib/shopify/catalog";
import hero from "../../assets/home/hero.jpg";
import homeInterior from "../../assets/home/home-interior.jpg";
import notesMosaic from "../../assets/home/notes-mosaic.jpg";

const TEASER_NOTES: { handle: string; name: string; group: NoteGroup }[] = [
  { handle: "bergamot", name: "Bergamot", group: "Citrus" },
  { handle: "iris", name: "Iris", group: "Floral" },
  { handle: "fig-leaf", name: "Fig leaf", group: "Green" },
  { handle: "vetiver", name: "Vetiver", group: "Woody" },
  { handle: "olibanum", name: "Olibanum", group: "Amber" },
  { handle: "vanilla", name: "Vanilla", group: "Gourmand" },
];

const SET_STEPS = [
  { title: "Choose a half", text: "Light: citrus, fresh, green, floral. Deep: woods, resins, gourmand." },
  { title: "Wear each for a few days", text: "See how it opens, settles and lasts through a day." },
  { title: "Pick a full bottle", text: "The one you kept reaching for, in 10, 50 or 100 ml." },
];

const primaryButton =
  "inline-flex min-h-12 items-center justify-center bg-ink px-6 text-sm tracking-wide text-paper hover:bg-ink/85";
const secondaryButton =
  "inline-flex min-h-12 items-center justify-center border border-ink px-6 text-sm tracking-wide hover:bg-ink hover:text-paper";

export default function Home() {
  return (
    <>
      <Hero />
      <Collection />
      <FinderTeaser />
      <DiscoverySets />
      <HomeFragrance />
    </>
  );
}

function SectionHeading({ id, kicker, title, link }: { id: string; kicker: string; title: string; link?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
      <div>
        <p className="label text-muted">{kicker}</p>
        <h2 id={id} className="mt-2 text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-medium">
          {title}
        </h2>
      </div>
      {link ? (
        <Link href={link.href} className="py-2 text-sm underline underline-offset-4 hover:no-underline">
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="container-page pt-4 sm:pt-6">
      <div className="relative">
        <div className="relative aspect-[4/3] overflow-hidden bg-wall sm:aspect-[16/9]">
          <Image
            src={hero}
            alt="Three Tessel bottles — Mullion, Clerestory and Architrave — on stepped stone plinths in window light"
            fill
            priority
            placeholder="blur"
            sizes="(min-width: 90rem) 85rem, 100vw"
            className="object-cover object-[80%_50%]"
          />
        </div>
        <div className="border-x border-b border-line bg-paper p-6 sm:p-8 lg:absolute lg:top-1/2 lg:left-10 lg:max-w-lg lg:-translate-y-1/2 lg:border lg:p-10">
          <p className="label text-muted">Eau de parfum · 10 compositions</p>
          <h1 id="hero-title" className="mt-3 text-[clamp(2.25rem,4vw,3.75rem)] leading-[1.02] font-medium tracking-[-0.02em]">
            Fragrance, built like architecture.
          </h1>
          <p className="mt-5 max-w-[40ch] text-base leading-relaxed text-muted">
            Ten scents named after parts of a building — from bright Clerestory to smoky Architrave. Tell us which
            notes you like and see which ones fit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/finder" className={primaryButton}>
              Find your scent
            </Link>
            <Link href="/collections/perfumes" className={secondaryButton}>
              Shop the collection
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

async function Collection() {
  const listing = await getCollectionProducts("perfumes");
  if (!listing) return null;

  return (
    <section aria-labelledby="collection-title" className="container-page pt-20 lg:pt-28">
      <SectionHeading
        id="collection-title"
        kicker={`${listing.products.length} eaux de parfum`}
        title="The collection"
        link={{ href: "/collections/perfumes", label: "Shop all fragrances" }}
      />
      <ul className="grid grid-cols-2 border-l border-line sm:grid-cols-3 lg:grid-cols-5">
        {listing.products.map((product) => (
          <li key={product.handle} className="border-r border-b border-line">
            <ProductCard
              product={product}
              sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 31vw, 48vw"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function FinderTeaser() {
  return (
    <section aria-labelledby="finder-title" className="container-page pt-20 lg:pt-28">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="relative aspect-[16/9] overflow-hidden bg-wall lg:col-span-7">
          <Image
            src={notesMosaic}
            alt=""
            fill
            placeholder="blur"
            sizes="(min-width: 64rem) 55vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center lg:col-span-5">
          <p className="label text-muted">Fragrance finder</p>
          <h2 id="finder-title" className="mt-2 text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-medium">
            Start with notes you already love.
          </h2>
          <p className="mt-4 max-w-[46ch] text-muted">
            Bergamot peel, fig leaf, a vanilla pod. Pick what you like and what you’d rather avoid — the finder
            scores all ten fragrances and explains every match.
          </p>
          <ul className="mt-6 grid grid-cols-3 gap-2" aria-label="Start the finder with a note">
            {TEASER_NOTES.map((note) => (
              <li key={note.handle}>
                <Link
                  href={`/finder?like=${note.handle}`}
                  className={`flex aspect-square flex-col justify-between border border-control p-3 hover:border-ink hover:outline hover:outline-1 hover:outline-ink ${NOTE_GROUP_BG[note.group]}`}
                >
                  <span className="label text-ink">{note.group}</span>
                  <span className="text-sm leading-tight font-medium sm:text-base">{note.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Link href="/finder" className={primaryButton}>
              Start the finder
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

async function DiscoverySets() {
  const listing = await getCollectionProducts("discovery-sets");
  if (!listing?.products.length) return null;

  return (
    <section aria-labelledby="sets-title" className="container-page pt-20 lg:pt-28">
      <SectionHeading id="sets-title" kicker="Not sure yet" title="Try five before a full bottle" />
      <ul className="grid grid-cols-2 border-l border-line lg:grid-cols-4">
        <li className="col-span-2 flex flex-col justify-between gap-8 border-r border-b border-line p-4 sm:p-6 lg:p-10">
          <p className="max-w-[44ch] text-lg leading-relaxed">
            Each set holds five 2 ml sprays — the light half of the collection or the deep one. Enough to wear every
            scent for a few days, on skin rather than a paper strip.
          </p>
          <ol className="grid border-t border-line sm:grid-cols-3" aria-label="How a discovery set works">
            {SET_STEPS.map((step, i) => (
              <li key={step.title} className="border-b border-line py-4 last:border-b-0 sm:border-b-0 sm:py-5 sm:pr-5 sm:not-first:border-l sm:not-first:pl-5">
                <p className="label text-muted">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-3 font-medium">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </li>
        {listing.products.map((product) => (
          <li key={product.handle} className="border-r border-b border-line">
            <ProductCard product={product} kicker="5 × 2 ml" sizes="(min-width: 64rem) 22vw, 48vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}

async function HomeFragrance() {
  const listing = await getCollectionProducts("home-fragrance");
  if (!listing?.products.length) return null;

  return (
    <section aria-labelledby="home-title" className="container-page py-20 lg:py-28">
      <SectionHeading
        id="home-title"
        kicker="Candles and diffusers"
        title="The same scents, for the room"
        link={{ href: "/collections/home-fragrance", label: "Shop home fragrance" }}
      />
      <div className="relative mt-px aspect-[16/9] overflow-hidden bg-wall sm:aspect-[21/9]">
        <Image
          src={homeInterior}
          alt="A lit Architrave candle and a Clerestory reed diffuser on a travertine shelf in afternoon light"
          fill
          placeholder="blur"
          sizes="(min-width: 90rem) 85rem, 100vw"
          className="object-cover object-[75%_50%]"
        />
      </div>
      <ul className="grid grid-cols-2 border-l border-line sm:grid-cols-3 lg:grid-cols-5">
        {listing.products.map((product) => (
          <li key={product.handle} className="border-r border-b border-line">
            <ProductCard product={product} sizes="(min-width: 64rem) 18vw, (min-width: 40rem) 31vw, 48vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}
