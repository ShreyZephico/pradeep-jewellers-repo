import type legalEn from "@/data/scheme/legal.en.json";
import type siteEn from "@/data/scheme/site.en.json";

export type SchemeSite = typeof siteEn;
export type SchemeLegal = typeof legalEn;
export type SchemeMeta = SchemeSite["meta"];
export type SchemeTopNav = SchemeSite["topNav"];
export type SchemeFooter = SchemeSite["footer"];
export type SchemeMechanism = SchemeSite["mechanism"];
export type SchemePlans = SchemeSite["plans"];
export type SchemePlanItem = SchemePlans["items"][number];
export type SchemeHome = SchemeSite["home"];
export type SchemeHero = SchemeHome["hero"];
export type SchemeCalculator = SchemeHome["calculator"];
export type SchemeVisitUs = SchemeHome["visitUs"];
export type SchemeFaq = SchemeHome["faq"];
export type SchemeEnquiry = SchemeSite["enquiry"];
export type SchemeLegalDoc = SchemeLegal["privacy"] | SchemeLegal["terms"];
