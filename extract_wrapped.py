# Lifting a WRAPPED section: one whose markup sits inside an IIFE that computes its own locals.
#
# These read as harder than the free-standing ones and are actually easier, because the wrapper
# already draws the boundary. `{COND && (()=>{ BODY })()}` becomes `{COND && SECT.key(S, SX)}` with
# BODY moved wholesale — the locals travel with the markup that uses them, which is exactly the
# failure that blanked the villa when `blood` was lifted without its `w`.
#
# The condition stays at the CALL SITE, not inside the function. It is about whether the section
# belongs on the page at all; the function is about what the section looks like. Keeping it outside
# also means the call site still reads as a list of what this face shows, in order.
import re, sys
P="src/ludus.jsx"

def find(L, frag):
    start=next(i for i,x in enumerate(L) if x.startswith("export default function App"))
    for i in range(start, len(L)):
        if "<Sect " in L[i] and frag in L[i]: return start, i
    for i in range(start, len(L)):                       # title may sit a line or two below <Sect
        if frag in L[i] and any("<Sect " in L[k] for k in range(max(start,i-3), i)): 
            return start, next(k for k in range(i-3, i) if "<Sect " in L[k])
    return start, None

def wrapper(L, start, i):
    ind=len(L[i])-len(L[i].lstrip())
    for k in range(i-1, start, -1):
        s=L[k]
        if not s.strip(): continue
        ki=len(s)-len(s.lstrip())
        if ki >= ind: continue
        if "(()=>{" in s: return k
        ind = ki
    return None

def extract(frag, sid):
    L=open(P).read().split("\n")
    start, i = find(L, frag)
    if i is None: return f"NOT FOUND: {frag}"
    w = wrapper(L, start, i)
    if w is None: return f"NO IIFE WRAPPER: {frag}"
    # THE MATCHING CLOSE, NOT THE FIRST ONE. Taking the first line ending in `})()}` lifted 24 lines
    # of `year`'s 48-line wrapper, because the section has a nested IIFE inside it — the close it
    # found belonged to the inner one. Balance the brackets from the wrapper line instead, and stop
    # at the first line ending in `})()}` where the balance has come back to zero.
    bal = 0; e = None
    for q in range(w, len(L)):
        t = re.sub(r"//.*$", "", L[q])
        bal += t.count("(") + t.count("{") - t.count(")") - t.count("}")
        if q > w and bal <= 0 and L[q].rstrip().endswith("})()}"): e = q; break
    if e is None: return "NO CLOSING })()} FOUND: " + frag

    head = L[w]; ind = len(head)-len(head.lstrip())
    pre, _, rest = head.partition("(()=>{")
    cond = pre.strip()
    if cond.startswith("{"): cond = cond[1:].strip()
    if cond.endswith("&&"): cond = cond[:-2].strip()
    body = ([rest] if rest.strip() else []) + L[w+1:e] + [L[e].rstrip()[:-len("})()}")].rstrip()]
    body = [b for b in body if b.strip()]
    shift = min(len(b)-len(b.lstrip()) for b in body)
    body = [("    " + b[shift:]) if len(b)-len(b.lstrip()) >= shift else "    "+b.strip() for b in body]

    src="\n".join(body)
    names=set()
    for x in L[start:]:
        m=re.match(r'\s{2}const (\w+)\s*=', x)
        if m: names.add(m.group(1))
    sx = set(re.findall(r'\w+', re.search(r'const SX = \{([^}]*)\}', "\n".join(L)).group(1)))
    hits=sorted(n for n in names if re.search(r'(?<![\w.$])'+re.escape(n)+r'(?![\w$])', src))
    uses=[n for n in hits if n in sx]

    fn=[f"  {sid}: (S, X) => {{" + (" const { " + ", ".join(uses) + " } = X;" if uses else "")] + body + ["  },"]
    call_expr = f"SECT.{sid}(S, SX)"
    if cond: call_expr = f"{cond} && {call_expr}"
    prev = next((x for x in reversed(L[:w]) if x.strip()), "")
    call = " "*ind + (call_expr if prev.rstrip().endswith("(") and not cond else "{"+call_expr+"}")

    L2 = L[:w] + [call] + L[e+1:]
    k = next(idx for idx,x in enumerate(L2) if x.startswith("const SECT = {"))
    L2 = L2[:k+1] + fn + L2[k+1:]
    open(P,"w").write("\n".join(L2))
    return f"{sid}: {e-w+1} lines lifted, takes {len(uses)} from SX ({', '.join(uses) or 'none'})" + (f", condition stays: {cond[:50]}" if cond else "")

if __name__ == "__main__":
    for spec in sys.argv[1:]:
        t,sid = spec.rsplit("::",1)
        print(" ", extract(t, sid))

# THE TWO MAP WRAPPERS. `STAFF_KEYS.map(k=>{…})` and `SLOTS.filter(…).map(slot=>{…})` differ from the
# IIFEs in one way that matters: the body reads a loop variable, so the lifted function takes it as a
# third argument. Everything else is the same lift. These two are worth the special case rather than
# leaving them behind — the weapon rack is the single tallest section in the game at 3,727px, the
# whole of the armory face, and the armory is where the fold problem actually lives.
def extract_map(frag, sid):
    L=open(P).read().split("\n")
    w = next((i for i,x in enumerate(L) if frag in x), None)
    if w is None: return "NOT FOUND: " + frag
    head = L[w]; ind = len(head)-len(head.lstrip())
    pre, _, rest = head.rpartition(".map(")
    var = rest.split("=>")[0].strip()
    body_first = rest.split("=>{",1)[1] if "=>{" in rest else ""
    bal = 0; e = None
    for q in range(w, len(L)):
        t = re.sub(r"//.*$", "", L[q])
        bal += t.count("(") + t.count("{") - t.count(")") - t.count("}")
        if q > w and bal <= 0 and L[q].rstrip().endswith("})}"): e = q; break
    if e is None: return "NO CLOSING })} FOUND: " + frag
    body = ([body_first] if body_first.strip() else []) + L[w+1:e] + [L[e].rstrip()[:-len("})}")].rstrip()]
    body = [b for b in body if b.strip()]
    shift = min(len(b)-len(b.lstrip()) for b in body)
    body = [("    " + b[shift:]) if len(b)-len(b.lstrip()) >= shift else "    "+b.strip() for b in body]

    src="\n".join(body)
    start=next(i for i,x in enumerate(L) if x.startswith("export default function App"))
    names={m.group(1) for m in (re.match(r'\s{2}const (\w+)\s*=', x) for x in L[start:]) if m}
    for x in L[start:]:                       # and the useState pairs — see the note in extract.py
        m=re.match(r'\s{2}const \[([^\]]*)\]\s*=', x)
        if m: names.update(re.findall(r'\w+', m.group(1)))
    sx = set(re.findall(r'\w+', re.search(r'const SX = \{([^}]*)\}', "\n".join(L)).group(1)))
    hits=[n for n in sorted(names) if re.search(r'(?<![\w.$])'+re.escape(n)+r'(?![\w$])', src)]
    uses=[n for n in hits if n in sx]
    missing=[n for n in hits if n not in sx]   # SILENTLY DROPPING THESE IS THE WHOLE BUG. extract.py
    # prints them; the first draft of this function did not, and the rack went out using `rackFilt`,
    # an App local SX does not carry. It built clean and blanked the armory the moment it opened.

    fn=[f"  {sid}: (S, X, {var}) => {{" + (" const { " + ", ".join(uses) + " } = X;" if uses else "")] + body + ["  },"]
    # the close matched is `})}`: `}` ends the arrow body, `)` ends .map(, and the last `}` shuts the
    # JSX expression — which may have been opened lines earlier, as it is for the staff panels, whose
    # head reads `) : STAFF_KEYS.map(k=>{` inside a ternary. So the brace always goes back on; testing
    # whether the HEAD starts with `{` only sees the rack, and drops it for the staff.
    call = pre + f".map({var} => SECT.{sid}(S, SX, {var}))}}"   # pre already carries the indent
    L2 = L[:w] + [call] + L[e+1:]
    k = next(idx for idx,x in enumerate(L2) if x.startswith("const SECT = {"))
    open(P,"w").write("\n".join(L2[:k+1] + fn + L2[k+1:]))
    note = f"{sid}: {e-w+1} lines lifted over `{var}`, takes {len(uses)} from SX ({', '.join(uses) or 'none'})"
    if missing: note += "\n      not in SX, NOT passed — check each is prose: " + ", ".join(missing)
    return note
