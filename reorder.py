# Reordering a face is now a list operation, which is what phase B was for.
#
# A "block" is one SECT call plus any comment lines attached directly above it. Blocks are lifted out
# of the face's region and re-inserted, in the requested order, at the position of the first one —
# so anything else living between them (a banner, a conditional panel) keeps its place rather than
# being shuffled by accident.
#
# It refuses rather than guesses: if the named sections are not all present in one contiguous run of
# blocks-and-blank-lines, it says so and changes nothing.
import re, sys
P = "src/ludus.jsx"
CALL = re.compile(r'SECT\.(\w+)\(')

def blocks(L, lo, hi):
    """A block is the whole JSX EXPRESSION holding the call, not the call's line.

    Half of these call sites are one line, `{SECT.unrest(S)}`. The rest are not:

        {owedList(S).length>0 && (
          SECT.owed(S, SX)
        )}

    Taking the middle line and leaving the condition and its closing brace behind would move the
    panel and corrupt the face at the same time — and it would still compile, because the braces
    balance across the file even when they no longer mean what they did. So: walk back to the line
    that OPENS the expression, then forward until the braces and parens come back to zero."""
    out = []
    i = lo
    while i < hi:
        m = CALL.search(L[i])
        if not m: i += 1; continue
        # back to the line that opens this JSX expression
        a = i
        while a > lo and not L[a].lstrip().startswith("{"):
            a -= 1
        if not L[a].lstrip().startswith("{"): i += 1; continue
        # forward until balanced
        # AND IF IT DOES NOT CLOSE INSIDE THE REGION, SAY SO. Passing a region that ended on the last
        # block's CALL line left that block's `)}` one line outside it: the call moved and its closing
        # brace stayed, which still balanced across the file and still compiled far enough to produce
        # a baffling error 14 lines away. An unterminated block is a refusal, not a guess.
        depth = 0; b = None
        for k in range(a, hi):
            t = re.sub(r"//.*$", "", L[k])
            depth += t.count("{") + t.count("(") - t.count("}") - t.count(")")
            if k >= i and depth <= 0: b = k; break
        if b is None:
            out.append({"name": m.group(1), "a": a, "b": i, "open": True})
            i += 1
            continue
        # AND THE COMMENT ABOVE IT, WHICH IS PROSE. This file does not write `*` down the left margin
        # of a block comment — the continuation lines are plain indented English, so a walk-back that
        # tests "does this line look like a comment" stops at the second line every time. That exact
        # trap cost v3.69.0 a miscount. Instead: if the line above closes a comment, walk back to the
        # line that OPENS it, and take the lot.
        k = a
        while True:
            m2 = k-1
            while m2 >= lo and not L[m2].strip(): m2 -= 1          # step over blank lines
            if m2 < lo: break
            t = L[m2].rstrip()
            if t.endswith("*/}") or t.endswith("*/"):
                o = m2
                while o > lo and "/*" not in L[o]: o -= 1
                if "/*" not in L[o]: break
                k = o
            elif L[m2].lstrip().startswith(("{/*", "/*")) and "*/" in L[m2]:
                k = m2
            else:
                break
        a = k
        out.append({"name": m.group(1), "a": a, "b": b})
        i = b + 1
    return out

def reorder(face_lo, face_hi, order):
    L = open(P).read().split("\n")
    bs = blocks(L, face_lo-1, face_hi)
    unclosed = [b["name"] for b in bs if b.get("open")]
    if unclosed:
        return "REFUSED — %s does not close inside the region; widen it past the block's `)}`" % unclosed
    have = [b["name"] for b in bs]
    if sorted(have) != sorted(order):
        return "REFUSED — region holds %s, asked for %s" % (have, order)
    lo, hi = bs[0]["a"], bs[-1]["b"]
    # everything between the first and last block must be block lines or blank
    owned = set()
    for b in bs: owned.update(range(b["a"], b["b"]+1))
    stray = [k+1 for k in range(lo, hi+1) if k not in owned and L[k].strip()]
    if stray:
        return "REFUSED — lines %s sit between the blocks and are not part of any" % stray[:6]
    by = {b["name"]: L[b["a"]:b["b"]+1] for b in bs}
    new = []
    for n in order:
        new.extend(by[n])
    out = L[:lo] + new + L[hi+1:]
    open(P, "w").write("\n".join(out))
    return "reordered %d blocks: %s" % (len(order), " -> ".join(order))

if __name__ == "__main__":
    lo, hi = int(sys.argv[1]), int(sys.argv[2])
    print(" ", reorder(lo, hi, sys.argv[3].split(",")))
