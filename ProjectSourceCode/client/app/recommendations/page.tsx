import Navbar from "../../components/Navbar";
import Image from "next/image";

const _recommendedShows = [
  {
    id: 1,
    title: "Abbott Elementary",
    genre: "Comedy",
    platforms: ["Hulu"],
  },
  {
    id: 2,
    title: "Breaking Bad",
    genre: "Crime Drama",
    platforms: ["Netflix"],
  },
  {
    id: 3,
    title: "Severance",
    genre: "Thriller",
    platforms: ["Apple TV+"],
  },
];

export default function RecommendationsPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold">Recommended for You</h1>
        <p className="mb-8 text-sm text-gray-600">
          Suggested shows based on your interests and saved platforms.
        </p>

        <h2 className="mb-2 text-2xl font-bold">Insert Genre</h2>

        {/* Need to adjust to work within my code, dependency issue? */}
        {/* Multi-item Carousel */}
        <section className="pt-5 pb-5">
          <div className="container">
            <div className="row">
              <div className="col-6">
                <h3 className="mb-3">Multi Item Carousel cards</h3>
              </div>
              <div className="col-6 text-right">
                <button
                  className="btn btn-primary mb-3 mr-1"
                  data-bs-target="#carouselExampleIndicators2"
                  data-bs-slide="prev"
                  type="button"
                >
                  <i className="fa fa-arrow-left" />
                </button>
                <button
                  className="btn btn-primary mb-3"
                  data-bs-target="#carouselExampleIndicators2"
                  data-bs-slide="next"
                  type="button"
                >
                  <i className="fa fa-arrow-right" />
                </button>
              </div>
              <div className="col-12">
                <div
                  id="carouselExampleIndicators2"
                  className="carousel slide"
                  data-bs-ride="carousel"
                >
                  <div className="carousel-inner">
                    <div className="carousel-item active">
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <div className="card">
                            <Image
                              className="img-fluid"
                              alt="Placeholder"
                              src="https://placehold.co/280x280"
                              width={280}
                              height={280}
                            />
                            <div className="card-body">
                              <h4 className="card-title">
                                Special title treatment
                              </h4>
                              <p className="card-text">
                                With supporting text below as a natural lead-in.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="card">
                            <Image
                              className="img-fluid"
                              alt="Placeholder"
                              src="https://placehold.co/280x280"
                              width={280}
                              height={280}
                            />
                            <div className="card-body">
                              <h4 className="card-title">
                                Special title treatment
                              </h4>
                              <p className="card-text">
                                With supporting text below as a natural lead-in
                                to additional content.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="card">
                            <Image
                              className="img-fluid"
                              alt="Placeholder"
                              src="https://placehold.co/280x280"
                              width={280}
                              height={280}
                            />
                            <div className="card-body">
                              <h4 className="card-title">
                                Special title treatment
                              </h4>
                              <p className="card-text">
                                With supporting text below as a natural lead-in
                                to additional content.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="carousel-item">
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <div className="card">
                            <Image
                              className="img-fluid"
                              alt="Placeholder"
                              src="https://placehold.co/280x280"
                              width={280}
                              height={280}
                            />
                            <div className="card-body">
                              <h4 className="card-title">
                                Special title treatment
                              </h4>
                              <p className="card-text">
                                With supporting text below as a natural lead-in
                                to additional content.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="card">
                            <Image
                              className="img-fluid"
                              alt="Placeholder"
                              src="https://placehold.co/280x280"
                              width={280}
                              height={280}
                            />
                            <div className="card-body">
                              <h4 className="card-title">
                                Special title treatment
                              </h4>
                              <p className="card-text">
                                With supporting text below as a natural lead-in
                                to additional content.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="card">
                            <Image
                              className="img-fluid"
                              alt="Placeholder"
                              src="https://placehold.co/280x280"
                              width={280}
                              height={280}
                            />
                            <div className="card-body">
                              <h4 className="card-title">
                                Special title treatment
                              </h4>
                              <p className="card-text">
                                With supporting text below as a natural lead-in
                                to additional content.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <h2 className="mb-2 text-2xl font-bold">Insert Genre</h2>
      </div>
    </main>
  );
}
