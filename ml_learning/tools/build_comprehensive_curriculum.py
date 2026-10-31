#!/usr/bin/env python3
"""
Comprehensive Curriculum & Question Bank Generator
Generates full elaborated subtopics, math foundations, code playground exercises,
and 35 high-quality questions for each of the 40 ML topics across 5 skill levels.
"""

import json
import os
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOLS_DIR)

BASE_DIR = os.path.dirname(TOOLS_DIR)
CONTENT_DIR = os.path.join(BASE_DIR, "content")
TOPICS_DIR = os.path.join(CONTENT_DIR, "topics")
os.makedirs(TOPICS_DIR, exist_ok=True)

# Import Generators
from level_novice import get_novice_topics
from level_novice_part2 import get_novice_part2_topics

from level_beginner_part1 import get_beginner_part1_topics
from level_beginner_part1_b import get_beginner_part1_b_topics
from level_beginner_part2 import get_beginner_part2_topics
from level_beginner_part2_b import get_beginner_part2_b_topics

from level_intermediate_part1 import get_intermediate_part1_topics
from level_intermediate_part1_b import get_intermediate_part1_b_topics
from level_intermediate_part2 import get_intermediate_part2_topics

from level_advanced_part1 import get_advanced_part1_topics
from level_advanced_part1_b import get_advanced_part1_b_topics
from level_advanced_part2 import get_advanced_part2_topics
from level_advanced_part2_b import get_advanced_part2_b_topics

from level_professional_part1 import get_professional_part1_topics
from level_professional_part2 import get_professional_part2_topics
from level_professional_part3 import get_professional_part3_topics

LEVELS_META = [
    {
        "id": "novice",
        "name": "Novice",
        "subtitle": "The Foundations",
        "description": "Essential mathematical intuition, core concepts, types of learning, and project lifecycles.",
        "icon": "🌱",
        "color": "#00d4aa"
    },
    {
        "id": "beginner",
        "name": "Beginner",
        "subtitle": "Core Supervised Learning",
        "description": "Master classical supervised algorithms: regressions, classification, trees, metrics, and validation.",
        "icon": "🚀",
        "color": "#4dabf7"
    },
    {
        "id": "intermediate",
        "name": "Intermediate",
        "subtitle": "Ensembles, Kernels & Unsupervised",
        "description": "Feature engineering, SVMs, Bagging, Random Forests, Boosting, Clustering, PCA, and production Pipelines.",
        "icon": "⚡",
        "color": "#ffd43b"
    },
    {
        "id": "advanced",
        "name": "Advanced",
        "subtitle": "Deep Learning & Neural Architectures",
        "description": "Neural networks from scratch, backprop, optimizers, regularization, CNNs, sequence models, and hyperparameter tuning.",
        "icon": "🔥",
        "color": "#ff8c42"
    },
    {
        "id": "professional",
        "name": "Professional",
        "subtitle": "Transformers, SOTA LLMs & MLOps",
        "description": "Self-attention, modern NLP, RAG, PEFT/LoRA fine-tuning, generative models, high-throughput deployment, and MLOps.",
        "icon": "👑",
        "color": "#ff5757"
    }
]

def main():
    print("=== Building Comprehensive Machine Learning Curriculum ===")
    
    # 1. Novice Level (7 Topics)
    novice_topics = get_novice_topics() + get_novice_part2_topics()
    for t in novice_topics: t["level"] = "novice"
    print(f"Loaded {len(novice_topics)} Novice topics.")

    # 2. Beginner Level (8 Topics)
    beginner_topics = (
        get_beginner_part1_topics() + 
        get_beginner_part1_b_topics() + 
        get_beginner_part2_topics() + 
        get_beginner_part2_b_topics()
    )
    for t in beginner_topics: t["level"] = "beginner"
    print(f"Loaded {len(beginner_topics)} Beginner topics.")

    # 3. Intermediate Level (8 Topics)
    intermediate_topics = (
        get_intermediate_part1_topics() +
        get_intermediate_part1_b_topics() +
        get_intermediate_part2_topics()
    )
    for t in intermediate_topics: t["level"] = "intermediate"
    print(f"Loaded {len(intermediate_topics)} Intermediate topics.")

    # 4. Advanced Level (8 Topics)
    advanced_topics = (
        get_advanced_part1_topics() +
        get_advanced_part1_b_topics() +
        get_advanced_part2_topics() +
        get_advanced_part2_b_topics()
    )
    for t in advanced_topics: t["level"] = "advanced"
    print(f"Loaded {len(advanced_topics)} Advanced topics.")

    # 5. Professional Level (9 Topics)
    professional_topics = (
        get_professional_part1_topics() +
        get_professional_part2_topics() +
        get_professional_part3_topics()
    )
    for t in professional_topics: t["level"] = "professional"
    print(f"Loaded {len(professional_topics)} Professional topics.")

    all_levels_data = {
        "novice": novice_topics,
        "beginner": beginner_topics,
        "intermediate": intermediate_topics,
        "advanced": advanced_topics,
        "professional": professional_topics
    }

    total_topics = 0
    total_questions = 0

    # Write individual modular topic files
    print("\nWriting individual modular topic files into content/topics/{id}.json...")
    for lvl_id, t_list in all_levels_data.items():
        for t in t_list:
            total_topics += 1
            q_count = len(t.get("quiz", []))
            total_questions += q_count
            
            topic_file = os.path.join(TOPICS_DIR, f"{t['id']}.json")
            with open(topic_file, "w", encoding="utf-8") as f:
                json.dump(t, f, indent=2, ensure_ascii=False)
            print(f"  [{lvl_id.upper()}] {t['id']:<26}: {q_count} questions | File: {topic_file}")

    # Build master topics.json catalog
    master_catalog = {
        "levels": []
    }

    for lvl in LEVELS_META:
        lvl_id = lvl["id"]
        t_list = all_levels_data[lvl_id]
        
        # In master catalog, keep full topic data or lightweight metadata
        lvl_entry = dict(lvl)
        lvl_entry["topics"] = t_list
        master_catalog["levels"].append(lvl_entry)

    master_path = os.path.join(CONTENT_DIR, "topics.json")
    print(f"\nWriting master catalog to {master_path}...")
    with open(master_path, "w", encoding="utf-8") as f:
        json.dump(master_catalog, f, indent=2, ensure_ascii=False)

    print("\n" + "="*60)
    print("SUCCESSFULLY GENERATED COMPREHENSIVE CURRICULUM!")
    print(f"Total Levels:    5")
    print(f"Total Topics:    {total_topics}")
    print(f"Total Questions: {total_questions} (avg {total_questions / total_topics:.1f} per topic)")
    print(f"Individual JSONs: {TOPICS_DIR}")
    print(f"Master Catalog:   {master_path}")
    print("="*60)

if __name__ == "__main__":
    main()
