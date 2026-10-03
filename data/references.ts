/**
 * Reference registry. Every DOI/URL here was checked on 2026-10-03: DOIs against the Crossref record
 * (title, authors, journal and year match), URLs by opening them. Publishers that block automated
 * requests (Wiley, AAAS) were verified through Crossref instead.
 */
export type Reference = { id: string; text: string; url: string };

const doi = (d: string) => `https://doi.org/${d}`;

export const REFERENCES: Record<string, Reference> = {
  // --- books and reports
  ord2020: { id: "ord2020", text: "Ord, T. (2020). The Precipice: Existential Risk and the Future of Humanity, Table 6.1. Hachette.", url: "https://theprecipice.com/" },
  ar6wg1: { id: "ar6wg1", text: "IPCC (2021). AR6 Working Group I, Summary for Policymakers.", url: "https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/" },
  wmo2024: { id: "wmo2024", text: "WMO (2025). State of the Global Climate 2024: 2024 was likely the first calendar year above 1.5 °C (1.55 ± 0.13 °C over 1850-1900).", url: "https://wmo.int/files/state-of-global-climate-2024" },
  sipri2026: { id: "sipri2026", text: "SIPRI Yearbook 2026, world nuclear forces (January 2026).", url: "https://www.sipri.org/yearbook/2026" },
  bulletin: { id: "bulletin", text: "Bulletin of the Atomic Scientists, Doomsday Clock.", url: "https://thebulletin.org/doomsday-clock/" },
  usgsCascadia: { id: "usgsCascadia", text: "USGS Fact Sheet 2025-3050: Earthquake probabilities and hazards in the U.S. Pacific Northwest.", url: "https://pubs.usgs.gov/publication/fs20253050" },
  usgsArk: { id: "usgsArk", text: "USGS Open-File Report 2010-1312: Overview of the ARkStorm scenario.", url: "https://pubs.usgs.gov/publication/ofr20101312" },
  whoExcess: { id: "whoExcess", text: "WHO (2022). 14.9 million excess deaths were associated with the COVID-19 pandemic in 2020 and 2021.", url: "https://www.who.int/news/item/05-05-2022-14.9-million-excess-deaths-were-associated-with-the-covid-19-pandemic-in-2020-and-2021" },
  cisa2016: { id: "cisa2016", text: "CISA (2016). Cyber-attack against Ukrainian critical infrastructure (IR-ALERT-H-16-056-01).", url: "https://www.cisa.gov/news-events/ics-alerts/ir-alert-h-16-056-01" },
  odqn2009: { id: "odqn2009", text: "NASA Orbital Debris Quarterly News, vol. 13 issue 2 (2009): the Iridium 33 / Cosmos 2251 collision.", url: "https://orbitaldebris.jsc.nasa.gov/quarterly-news/pdfs/odqnv13i2.pdf" },
  ipbes2019: { id: "ipbes2019", text: "IPBES (2019). Global Assessment Report on Biodiversity and Ecosystem Services.", url: "https://www.ipbes.net/global-assessment" },
  noaaAcid: { id: "noaaAcid", text: "NOAA National Ocean Service: What is ocean acidification? (the ocean absorbs about 30% of the CO₂ released into the atmosphere).", url: "https://oceanservice.noaa.gov/facts/acidification.html" },
  nasaDefense: { id: "nasaDefense", text: "NASA Planetary Defense Coordination Office.", url: "https://www.nasa.gov/planetarydefense/" },
  sentry: { id: "sentry", text: "NASA/JPL CNEOS Sentry impact risk table.", url: "https://cneos.jpl.nasa.gov/sentry/" },
  swpcStorms: { id: "swpcStorms", text: "NOAA SWPC: geomagnetic storms and the G scale.", url: "https://www.swpc.noaa.gov/phenomena/geomagnetic-storms" },
  usgsYvo: { id: "usgsYvo", text: "USGS Yellowstone Volcano Observatory.", url: "https://www.usgs.gov/observatories/yvo" },
  lloydsFood: { id: "lloydsFood", text: "Lloyd's (2015). Food System Shock: the insurance impacts of acute disruption to global food supply. Emerging Risk Report, with Anglia Ruskin University (executive summary).", url: "https://assets.lloyds.com/media/39690c48-2a31-474b-8ff0-9d27f8d02c7c/pdf-food-system-shock-exec-summary-june-2015.pdf" },

  whoSsa: { id: "whoSsa", text: "WHO Surveillance System for Attacks on Health Care (SSA).", url: "https://extranet.who.int/ssa/" },
  unhcr: { id: "unhcr", text: "UNHCR, Global Trends: forced displacement (annual report; the site blocks automated link checks, the page exists).", url: "https://www.unhcr.org/global-trends" },

  // --- journal articles (DOI checked against Crossref)
  robock2000: { id: "robock2000", text: "Robock, A. (2000). Volcanic eruptions and climate. Reviews of Geophysics 38:191-219.", url: doi("10.1029/1998RG000054") },
  raible2016: { id: "raible2016", text: "Raible, C.C. et al. (2016). Tambora 1815 as a test case for high impact volcanic eruptions. WIREs Climate Change 7.", url: doi("10.1002/wcc.407") },
  xia2022: { id: "xia2022", text: "Xia, L. et al. (2022). Global food insecurity and famine from reduced crop, marine fishery and livestock production due to climate disruption from nuclear war soot injection. Nature Food 3:586-596.", url: doi("10.1038/s43016-022-00573-0") },
  coupe2019: { id: "coupe2019", text: "Coupe, J. et al. (2019). Nuclear winter responses to nuclear war between the United States and Russia in WACCM4 and ModelE. J. Geophys. Res. Atmos. 124:8522-8543.", url: doi("10.1029/2019JD030509") },
  robock2007: { id: "robock2007", text: "Robock, A. et al. (2007). Nuclear winter revisited with a modern climate model and current nuclear arsenals. J. Geophys. Res. 112:D13107.", url: doi("10.1029/2006JD008235") },
  brockmann2013: { id: "brockmann2013", text: "Brockmann, D. & Helbing, D. (2013). The hidden geometry of complex, network-driven contagion phenomena. Science 342:1337-1342.", url: doi("10.1126/science.1245200") },
  johnson2002: { id: "johnson2002", text: "Johnson, N.P.A.S. & Mueller, J. (2002). Updating the accounts: global mortality of the 1918-1920 'Spanish' influenza pandemic. Bull. Hist. Med. 76:105-115.", url: doi("10.1353/bhm.2002.0022") },
  riley2012: { id: "riley2012", text: "Riley, P. (2012). On the probability of occurrence of extreme space weather events. Space Weather 10:S02012.", url: doi("10.1029/2011SW000734") },
  cliver2013: { id: "cliver2013", text: "Cliver, E.W. & Dietrich, W.F. (2013). The 1859 space weather event revisited: limits of extreme activity. J. Space Weather Space Clim. 3:A31.", url: doi("10.1051/swsc/2013053") },
  boteler2019: { id: "boteler2019", text: "Boteler, D.H. (2019). A 21st century view of the March 1989 magnetic storm. Space Weather 17.", url: doi("10.1029/2019SW002278") },
  alvarez1980: { id: "alvarez1980", text: "Alvarez, L.W. et al. (1980). Extraterrestrial cause for the Cretaceous-Tertiary extinction. Science 208:1095-1108.", url: doi("10.1126/science.208.4448.1095") },
  popova2013: { id: "popova2013", text: "Popova, O.P. et al. (2013). Chelyabinsk airburst, damage assessment, meteorite recovery, and characterization. Science 342:1069-1073.", url: doi("10.1126/science.1242642") },
  thomas2023: { id: "thomas2023", text: "Thomas, C.A. et al. (2023). Orbital period change of Dimorphos due to the DART kinetic impact. Nature 616:448-451.", url: doi("10.1038/s41586-023-05805-2") },
  collins2005: { id: "collins2005", text: "Collins, G.S., Melosh, H.J. & Marcus, R.A. (2005). Earth Impact Effects Program. Meteoritics & Planetary Science 40:817-840.", url: doi("10.1111/j.1945-5100.2005.tb00157.x") },
  parsons2004: { id: "parsons2004", text: "Parsons, T. (2004). Recalculated probability of M ≥ 7 earthquakes beneath the Sea of Marmara, Turkey. J. Geophys. Res. 109:B05304.", url: doi("10.1029/2003JB002667") },
  sherwood2010: { id: "sherwood2010", text: "Sherwood, S.C. & Huber, M. (2010). An adaptability limit to climate change due to heat stress. PNAS 107:9552-9555.", url: doi("10.1073/pnas.0913352107") },
  raymond2020: { id: "raymond2020", text: "Raymond, C., Matthews, T. & Horton, R.M. (2020). The emergence of heat and humidity too severe for human tolerance. Science Advances 6:eaaw1838.", url: doi("10.1126/sciadv.aaw1838") },
  vecellio2022: { id: "vecellio2022", text: "Vecellio, D.J. et al. (2022). Evaluating the 35 °C wet-bulb temperature adaptability threshold for young, healthy subjects. J. Appl. Physiol. 132:340-345.", url: doi("10.1152/japplphysiol.00738.2021") },
  murray2022: { id: "murray2022", text: "Murray, C.J.L. et al. (2022). Global burden of bacterial antimicrobial resistance in 2019. The Lancet 399:629-655.", url: doi("10.1016/S0140-6736(21)02724-0") },
  lagi2011: { id: "lagi2011", text: "Lagi, M., Bertrand, K.Z. & Bar-Yam, Y. (2011). The food crises and political instability in North Africa and the Middle East. arXiv:1108.2455.", url: "https://arxiv.org/abs/1108.2455" },
  mach2019: { id: "mach2019", text: "Mach, K.J. et al. (2019). Climate as a risk factor for armed conflict. Nature 571:193-197.", url: doi("10.1038/s41586-019-1300-6") },
  kessler1978: { id: "kessler1978", text: "Kessler, D.J. & Cour-Palais, B.G. (1978). Collision frequency of artificial satellites: the creation of a debris belt. J. Geophys. Res. 83:2637-2646.", url: doi("10.1029/JA083iA06p02637") },
  armstrongMcKay2022: { id: "armstrongMcKay2022", text: "Armstrong McKay, D.I. et al. (2022). Exceeding 1.5 °C global warming could trigger multiple climate tipping points. Science 377:eabn7950.", url: doi("10.1126/science.abn7950") },
  lenton2019: { id: "lenton2019", text: "Lenton, T.M. et al. (2019). Climate tipping points: too risky to bet against. Nature 575:592-595.", url: doi("10.1038/d41586-019-03595-0") },
  schmidtko2017: { id: "schmidtko2017", text: "Schmidtko, S., Stramma, L. & Visbeck, M. (2017). Decline in global oceanic oxygen content during the past five decades. Nature 542:335-339.", url: doi("10.1038/nature21399") },
  klein2007: { id: "klein2007", text: "Klein, A.-M. et al. (2007). Importance of pollinators in changing landscapes for world crops. Proc. R. Soc. B 274:303-313.", url: doi("10.1098/rspb.2006.3721") },
  grace2024: { id: "grace2024", text: "Grace, K. et al. (2024). Thousands of AI authors on the future of AI. arXiv:2401.02843.", url: "https://arxiv.org/abs/2401.02843" },
  timofeev2019: { id: "timofeev2019", text: "Timofeev, V. et al. (2019). Insights from Bacillus anthracis strains isolated from permafrost in the tundra zone of Russia. PLOS ONE 14:e0209140.", url: doi("10.1371/journal.pone.0209140") },
  legendre2014: { id: "legendre2014", text: "Legendre, M. et al. (2014). Thirty-thousand-year-old distant relative of giant icosahedral DNA viruses with a pandoravirus morphology. PNAS 111:4274-4279.", url: doi("10.1073/pnas.1320670111") },
  alempic2023: { id: "alempic2023", text: "Alempic, J.-M. et al. (2023). An update on eukaryotic viruses revived from ancient permafrost. Viruses 15:564.", url: doi("10.3390/v15020564") },
  ward2001: { id: "ward2001", text: "Ward, S.N. & Day, S. (2001). Cumbre Vieja Volcano: potential collapse and tsunami at La Palma, Canary Islands. Geophys. Res. Lett. 28:3397-3400.", url: doi("10.1029/2001GL013110") },
  lovholt2008: { id: "lovholt2008", text: "Løvholt, F., Pedersen, G. & Gisler, G. (2008). Oceanic propagation of a potential tsunami from the La Palma Island. J. Geophys. Res. 113:C09026.", url: doi("10.1029/2007JC004603") },
  melott2004: { id: "melott2004", text: "Melott, A. et al. (2004). Did a gamma-ray burst initiate the late Ordovician mass extinction? Int. J. Astrobiology 3.", url: doi("10.1017/S1473550404001910") },
  glassmeier2010: { id: "glassmeier2010", text: "Glassmeier, K.-H. & Vogt, J. (2010). Magnetic polarity transitions and biospheric effects. Space Science Reviews 155.", url: doi("10.1007/978-1-4419-7955-1_14") },
  buttazzo2013: { id: "buttazzo2013", text: "Buttazzo, D. et al. (2013). Investigating the near-criticality of the Higgs boson. J. High Energy Phys. 2013:89.", url: doi("10.1007/JHEP12(2013)089") },
  ellis2008: { id: "ellis2008", text: "Ellis, J. et al. (2008). Review of the safety of LHC collisions. J. Phys. G 35:115004.", url: doi("10.1088/0954-3899/35/11/115004") },
};

export function ref(id: string): Reference {
  const r = REFERENCES[id];
  if (!r) throw new Error(`unknown reference ${id}`);
  return r;
}
