import re, sys, json
P="src/ludus.jsx"
def load(): return open(P).read().split("\n")

def app_locals(L):
    start=next(i for i,x in enumerate(L) if x.startswith("export default function App"))
    names=set()
    for x in L[start:]:
        m=re.match(r'\s{2}const (\w+)\s*=', x)
        if m: names.add(m.group(1))
    return start, names

def blocks(L, start):
    out=[]; i=start
    while i < len(L):
        if "<Sect " in L[i]:
            j=i+1
            while j < len(L) and L[j].strip() != "</Sect>": j+=1
            out.append((i,j))
            i=j+1
        else: i+=1
    return out

def extract(title_frag, sid):
    L=load(); start,names=app_locals(L)
    tgt=None
    for (i,j) in blocks(L,start):
        if title_frag in L[i]: tgt=(i,j); break
    if not tgt: return f"NOT FOUND: {title_frag}"
    i,j=tgt
    body=L[i:j+1]
    ind=len(body[0])-len(body[0].lstrip())
    src="\n".join(body)
    # which App locals does it use? (word-boundary is fine for DETECTION, not for rewriting)
    # NAMES ARE DETECTED BY WORD MATCH, AND THESE PANELS ARE PROSE — "A burial society" matches a
    # local called A, "every man on the roster" matches one called `on`. Detection is therefore
    # allowed to over-report, and the head destructures only what SX actually carries; anything
    # detected that SX does not have is PRINTED rather than silently bound to undefined, because a
    # name that arrives undefined does not fail at build time, it blanks the panel when opened.
    sx = set(re.findall(r'\w+', re.search(r'const SX = \{([^}]*)\}', "\n".join(L)).group(1)))
    hits=sorted(n for n in names if re.search(r'(?<![\w.$])'+re.escape(n)+r'(?![\w$])', src))
    uses=[n for n in hits if n in sx]
    missing=[n for n in hits if n not in sx]
    reind=[("    "+x[ind:]) if x.startswith(" "*ind) else x for x in body]
    head=f"  {sid}: (S, X) => {{"
    if uses: head += " const { " + ", ".join(uses) + " } = X;"
    fn=[head, "    return ("] + reind + ["    ); },"]
    # JSX child position wants {...}; an expression position (the sole child of a `return (`
    # or any open paren) wants the call bare. Getting this wrong builds a syntax error at best
    # and, if it parses, an object literal where markup should be.
    prev = next((x for x in reversed(L[:i]) if x.strip()), "")
    bare = prev.rstrip().endswith("(")
    call=" "*ind + ("SECT." + sid + "(S, SX)" if bare else "{SECT." + sid + "(S, SX)}")
    # splice: body -> call, and function into the SECT registry
    L2 = L[:i] + [call] + L[j+1:]
    k = next(idx for idx,x in enumerate(L2) if x.startswith("const SECT = {"))
    L2 = L2[:k+1] + fn + L2[k+1:]
    open(P,"w").write("\n".join(L2))
    note = f"{sid}: {j-i+1} lines, takes {len(uses)} from SX" + (f" ({', '.join(uses)})" if uses else " (none)")
    if missing: note += f"\n      not in SX, NOT passed — check each is prose: {', '.join(missing)}"
    return note

if __name__ == "__main__":
    for spec in sys.argv[1:]:
        t,sid = spec.rsplit("::",1)
        print(" ", extract(t, sid))
