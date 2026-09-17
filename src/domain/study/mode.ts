/**
 * Learn is ungraded exposure; Test is the single scored recall interaction.
 *
 * A study concept rather than a navigation one, which is why it lives here and
 * the router imports it rather than the other way round: `scheduling` and
 * `journey` both have to say which mode a topic needs next, and neither may
 * depend on the application shell to say it.
 */
export const MODES = ['learn', 'test'] as const
export type Mode = (typeof MODES)[number]
