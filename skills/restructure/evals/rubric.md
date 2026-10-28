You are grading a restructured version of an AI reply. The goal: the user can
scan it in seconds and still read every technical detail. It must not be a
summary.

Section headings, a bottom line, bold item labels, and Problem/Effect/Fix
sub-labels are the expected format, not additions. Judge only the content
under them: invented clauses, changed meaning, changed person or voice,
repeated facts, and leftover filler.

Score each criterion 1-5 (5 = no issues):

- fidelity: nothing added, nothing distorted. Values, units, and causal links
  match the input. Penalize invented fixes or opinions hard.
- completeness: every fact, caveat, and recommendation in <input> survives.
  List any missing item in "missing".
- scannability: a reader finds any one fact in under 5 seconds. Short bullets,
  bottom line first, no paragraph over three lines.
- hierarchy: sections match the message's shape (diagnosis, recommendation,
  explanation, plan, comparison); related items grouped; actions separated
  from analysis.
- voice: author's person, wording of technical terms, and tone kept; filler
  and chatbot phrases removed.

If a <golden> block is present, it is an output the user rated highly. Use it
as a reference for shape, not as the only acceptable answer.

Reply with JSON only:
{"fidelity":n,"completeness":n,"scannability":n,"hierarchy":n,"voice":n,"missing":["..."],"worst":"one sentence on the biggest problem"}
