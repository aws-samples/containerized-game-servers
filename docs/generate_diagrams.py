#!/usr/bin/env python3
"""
Architecture diagrams (as code) for the containerized-game-servers samples.

Uses the `diagrams` library (https://diagrams.mingrammer.com/) with official
AWS and Kubernetes icons. Regenerate the PNGs with:

    python3 -m venv .venv && . .venv/bin/activate
    pip install diagrams          # requires graphviz (`dot`) on PATH
    python docs/generate_diagrams.py

Outputs:
    docs/images/cicd-pipeline.png     - shared CI/CD image pipeline
    <sample>/images/architecture.png  - per-pattern runtime architecture
"""
import os

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import EC2, EKS, ECR
from diagrams.aws.database import Aurora
from diagrams.aws.devtools import Codepipeline, Codebuild, Codecommit
from diagrams.aws.general import Users
from diagrams.aws.management import Cloudwatch
from diagrams.aws.network import NLB, VPCElasticNetworkInterface
from diagrams.aws.security import SecretsManager
from diagrams.k8s.compute import Pod, DaemonSet
from diagrams.onprem.vcs import Github

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GRAPH_ATTR = {"pad": "0.4", "splines": "spline", "fontsize": "16"}


def out(path):
    """Absolute output path (no extension); ensure its directory exists."""
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    return full


def cicd_pipeline():
    with Diagram(
        "CI/CD image pipeline",
        filename=out("docs/images/cicd-pipeline"),
        show=False, direction="LR", outformat="png", graph_attr=GRAPH_ATTR,
    ):
        with Cluster("Source (choose one)"):
            src = [Github("GitHub\n(CodeConnections)"), Codecommit("CodeCommit")]
        pipe = Codepipeline("CodePipeline")
        build = Codebuild("CodeBuild\nbuildx arm64/amd64")
        registry = ECR("Amazon ECR\n(your account)")
        src >> pipe >> build >> Edge(label="push image") >> registry


def supertuxkart():
    with Diagram(
        "SuperTuxKart - dedicated UDP server with Agones",
        filename=out("supertuxkart/images/architecture"),
        show=False, direction="TB", outformat="png", graph_attr=GRAPH_ATTR,
    ):
        players = Users("Players")
        ecr = ECR("ECR")
        nlb = NLB("Network Load Balancer")
        with Cluster("Amazon EKS + Karpenter"):
            server = Pod("STK server pod\n(Agones-managed)")
            EC2("Karpenter nodes") - Edge(style="dashed") - server
        players >> Edge(label="UDP") >> nlb >> server
        ecr >> Edge(style="dashed", label="image pull") >> server
        server >> Edge(style="dashed", label="metrics") >> Cloudwatch("CloudWatch")


def lyra():
    with Diagram(
        "Lyra (UE5) - NodePort per pod with Elastic IP",
        filename=out("lyra/images/architecture"),
        show=False, direction="TB", outformat="png", graph_attr=GRAPH_ATTR,
    ):
        players = Users("Players")
        ecr = ECR("ECR")
        eip = VPCElasticNetworkInterface("Elastic IP\nper node")
        with Cluster("Amazon EKS + Karpenter"):
            svc = Pod("Lyra server pod\n(NodePort service)")
            EC2("Karpenter node") - Edge(style="dashed") - svc
        players >> Edge(label="UDP") >> eip >> svc
        ecr >> Edge(style="dashed", label="image pull") >> svc


def craft():
    with Diagram(
        "Craft - stateful game with Aurora PostgreSQL",
        filename=out("craft/images/architecture"),
        show=False, direction="TB", outformat="png", graph_attr=GRAPH_ATTR,
    ):
        players = Users("Players")
        nlb = NLB("Network Load Balancer")
        with Cluster("Amazon EKS + Karpenter"):
            server = Pod("Craft server pods")
            auth = Pod("Auth service\n(Django)")
        db = Aurora("Aurora\nPostgreSQL")
        secrets = SecretsManager("Secrets Manager")
        players >> Edge(label="UDP") >> nlb >> server
        server >> Edge(label="game state") >> db
        auth >> Edge(label="tokens") >> db
        secrets >> Edge(style="dashed", label="CSI") >> server


def udp_nlb():
    with Diagram(
        "UDP over NLB with TCP health-check sidecar",
        filename=out("udp-nlb-sample/images/architecture"),
        show=False, direction="TB", outformat="png", graph_attr=GRAPH_ATTR,
    ):
        players = Users("Players")
        nlb = NLB("Network Load Balancer")
        with Cluster("Amazon EKS"):
            with Cluster("Game server pod"):
                game = Pod("game server\n(UDP)")
                sidecar = Pod("nginx sidecar\n(TCP health)")
                game - Edge(style="dotted") - sidecar
            webhook = Pod("Mutating webhook\n(injects sidecar)")
        players >> Edge(label="UDP") >> nlb >> game
        nlb >> Edge(label="TCP health check") >> sidecar
        webhook >> Edge(style="dashed", label="inject") >> sidecar


def mitigate():
    with Diagram(
        "Mitigate UDP flood with Agones + iptables",
        filename=out("mitigate-udp-flood-with-agones-iptables/images/architecture"),
        show=False, direction="TB", outformat="png", graph_attr=GRAPH_ATTR,
    ):
        legit = Users("Legitimate\nplayer bots")
        attacker = Users("Attacker\nbots")
        nlb = NLB("Network Load Balancer")
        with Cluster("Amazon EKS + Karpenter"):
            with Cluster("Game server pod"):
                initc = Pod("init: iptables\nhashlimit rate-limit")
                game = Pod("STK server\n(Agones)")
                initc >> Edge(style="dotted", label="NET_ADMIN") >> game
        legit >> Edge(label="UDP") >> nlb
        attacker >> Edge(color="red", label="flood") >> nlb
        nlb >> Edge(label="rate-limited") >> initc


def spot_sig():
    with Diagram(
        "Spot interruption handler",
        filename=out("spot-sig-handler/images/architecture"),
        show=False, direction="TB", outformat="png", graph_attr=GRAPH_ATTR,
    ):
        with Cluster("Amazon EKS + Karpenter"):
            with Cluster("EC2 Spot node"):
                spot = EC2("Spot instance")
                handler = DaemonSet("spot-sig-handler\n(DaemonSet)")
                game = Pod("game server pods")
                spot - Edge(style="dashed") - handler
                spot - Edge(style="dashed") - game
        cw = Cloudwatch("CloudWatch\nmetrics")
        handler >> Edge(label="poll IMDSv2") >> spot
        handler >> Edge(color="red", label="drain on notice") >> game
        handler >> Edge(style="dashed") >> cw


if __name__ == "__main__":
    cicd_pipeline()
    supertuxkart()
    lyra()
    craft()
    udp_nlb()
    mitigate()
    spot_sig()
    print("Diagrams generated.")
