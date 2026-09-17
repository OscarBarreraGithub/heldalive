import {describe,it,expect,vi,afterEach} from "vitest";
import {commitFiles} from "../../heldalive-runtime/cloud/github";
afterEach(()=>vi.unstubAllGlobals());
describe("notebook publication",()=>{
  it("preserves the base tree, uses non-forced branch updates, and reconciles a lost acknowledgement",async()=>{
    const refs:Record<string,string>={main:"base"};
    const commits:Record<string,{message:string;tree:{sha:string}}>= {base:{message:"Existing notebook",tree:{sha:"original-tree"}}};
    let trees=0;
    vi.stubGlobal("fetch",vi.fn(async(input:string,init:RequestInit)=>{
      expect((init.headers as Record<string,string>).Authorization).toBe("Bearer fixture-token");
      const route=new URL(input).pathname.replace("/repos/heldalive/memory-research/","");
      const body=init.body?JSON.parse(String(init.body)):undefined;
      expect(String(init.body)).not.toContain("fixture-token");
      if(route.startsWith("git/ref/heads/")){const branch=route.slice(14);return refs[branch]?Response.json({object:{sha:refs[branch]}}):new Response("missing",{status:404});}
      if(route==="git/refs"){refs[body.ref.replace("refs/heads/","")]=body.sha;return Response.json({object:{sha:body.sha}});}
      if(route.startsWith("git/commits/"))return Response.json(commits[route.slice(12)]);
      if(route==="git/trees"){expect(body.base_tree).toBe("original-tree");expect(body.tree[0].path).toBe("orchestration/instances/example.json");trees++;return Response.json({sha:"new-tree"});}
      if(route==="git/commits"){expect(body.parents).toEqual(["base"]);commits.new={message:body.message,tree:{sha:body.tree}};return Response.json({sha:"new"});}
      if(route.startsWith("git/refs/heads/")){expect(body.force).toBe(false);refs[route.slice(15)]=body.sha;return Response.json({object:{sha:body.sha}});}
      throw Error(`Unexpected test API ${route}`);
    }));
    const files={"orchestration/instances/example.json":"{}"};
    expect(await commitFiles("fixture-token","manager/example",files,"role-1")).toBe("new");
    expect(await commitFiles("fixture-token","manager/example",files,"role-1")).toBe("new");
    expect(trees).toBe(1);expect(refs.main).toBe("base");
  });
  it("does not bypass a reference conflict with a force push",async()=>{
    let patches=0;
    vi.stubGlobal("fetch",vi.fn(async(input:string,init:RequestInit)=>{
      if(init.method==="PATCH"){patches++;expect(JSON.parse(String(init.body)).force).toBe(false);return new Response("conflict",{status:422});}
      if(input.includes("/git/ref/"))return Response.json({object:{sha:"head"}});
      if(input.endsWith("/git/commits/head"))return Response.json({message:"prior",tree:{sha:"tree"}});
      return Response.json({sha:"next"});
    }));
    await expect(commitFiles("fixture-token","main",{"orchestration/LIVE.json":"{}"},"role-1")).rejects.toThrow("422");
    expect(patches).toBe(1);
  });
});
