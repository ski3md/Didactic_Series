#!/bin/bash

# AI-Enhanced WHO 2022 Thoracic Pathology Image Manifest Generator
# Usage: ./generate_image_manifest.sh [--ai] [--validate]

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
BASE_DIR="src/assets/images/granulomas"
OUTPUT_FILE="src/assets/data/image_manifest.json"
METADATA_RULES_FILE="src/assets/data/metadata_rules.json"
LOG_FILE="src/assets/logs/manifest_generation.log"
USE_AI=false
VALIDATE=false

# Ensure directories exist
mkdir -p "$(dirname "$OUTPUT_FILE")"
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Parse arguments
for arg in "$@"; do
  case $arg in
    --ai)
      USE_AI=true
      log "🤖 AI enrichment enabled"
      ;;
    --validate)
      VALIDATE=true
      log "✅ Manifest validation enabled"
      ;;
    *)
      log "Unknown option: $arg"
      exit 1
      ;;
  esac
done

# Check for required tools
command -v node >/dev/null 2>&1 || { log "❌ Node.js is required but not installed. Aborting."; exit 1; }
command -v jq >/dev/null 2>&1 || { log "⚠️ jq not found, using fallback JSON parsing"; }

# Start JSON with proper structure
log "🔧 Starting manifest generation..."
echo "{" > "$OUTPUT_FILE"
echo "  \"generated\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> "$OUTPUT_FILE"
echo "  \"ai_enhanced\": $USE_AI," >> "$OUTPUT_FILE"
echo "  \"version\": \"1.0.0\"," >> "$OUTPUT_FILE"
echo "  \"schema\": \"who-2022-thoracic\"," >> "$OUTPUT_FILE"
echo "  \"categories\": {" >> "$OUTPUT_FILE"

# WHO 2022 Thoracic Pathology Categories
declare -a CATEGORIES=("infectious" "noninfectious" "autoimmune" "foreign_body" "drug_related" "idiopathic")

first_category=true
for category in "${CATEGORIES[@]}"; do
  if [ "$first_category" = false ]; then
    echo "," >> "$OUTPUT_FILE"
  fi
  first_category=false
  
  log "📂 Processing category: $category"
  echo "    \"$category\": {" >> "$OUTPUT_FILE"
  
  # Find entities in this category
  first_entity=true
  for entity_dir in "$BASE_DIR"/*; do
    if [ -d "$entity_dir" ]; then
      entity_name=$(basename "$entity_dir")
      
      # Determine category for this entity
      entity_category=$(node -e "
        import fs from 'fs';
        try {
          const rules = JSON.parse(fs.readFileSync('$METADATA_RULES_FILE', 'utf8'));
          console.log(rules.entities['$entity_name']?.category || 'noninfectious');
        } catch (e) {
          console.log('noninfectious');
        }
      ")
      
      # Skip if not in current category
      if [ "$entity_category" != "$category" ]; then
        continue
      fi
      
      if [ "$first_entity" = false ]; then
        echo "," >> "$OUTPUT_FILE"
      fi
      first_entity=false
      
      log "  📄 Processing entity: $entity_name"
      echo "      \"$entity_name\": {" >> "$OUTPUT_FILE"
      
      # Process stains
      first_stain=true
      for stain_dir in "$entity_dir"/*; do
        if [ -d "$stain_dir" ]; then
          stain_name=$(basename "$stain_dir")
          
          if [ "$first_stain" = false ]; then
            echo "," >> "$OUTPUT_FILE"
          fi
          first_stain=false
          
          log "    🎨 Processing stain: $stain_name"
          echo "        \"$stain_name\": [" >> "$OUTPUT_FILE"
          
          # Process images
          first_image=true
          for img_path in "$stain_dir"/*.{jpg,jpeg,png,gif,bmp,webp}; do
            # Handle glob expansion safely
            for img in $img_path; do
              if [ -f "$img" ]; then
                if [ "$first_image" = false ]; then
                  echo "," >> "$OUTPUT_FILE"
                fi
                first_image=false
                
                log "      🖼️ Processing image: $(basename "$img")"
                
                # Generate unique ID using hash of path
                img_id=$(echo -n "$img" | sha256sum | cut -c1-16)
                
                # Generate image metadata
                img_metadata=$(node -e "
                  import fs from 'fs';
                  import path from 'path';
                  import crypto from 'crypto';
                  
                  try {
                    const rules = JSON.parse(fs.readFileSync('$METADATA_RULES_FILE', 'utf8'));
                    
                    const imgPath = '$img';
                    const filename = path.basename(imgPath);
                    const entityName = '$entity_name';
                    const stainName = '$stain_name';
                    const categoryName = '$entity_category';
                    const imgId = '$img_id';
                    
                    // Extract pattern from filename
                    let pattern = 'granulomatous inflammation';
                    const patterns = rules.entities[entityName]?.patterns || [];
                    for (const p of patterns) {
                      if (filename.toLowerCase().includes(p.keyword.toLowerCase())) {
                        pattern = p.description;
                        break;
                      }
                    }
                    
                    // Determine cells based on entity and stain
                    let cells = rules.entities[entityName]?.cells || ['epithelioid histiocytes'];
                    if (stainName === 'GMS' || stainName === 'PAS') {
                      cells = [...cells, 'fungal organisms'];
                    }
                    
                    // Determine stain role
                    let stainRole = 'general morphology';
                    if (rules.stainRoles[stainName]) {
                      stainRole = rules.stainRoles[stainName];
                    }
                    
                    // Determine difficulty
                    let difficulty = 'intermediate';
                    if (rules.entities[entityName]?.difficulty) {
                      difficulty = rules.entities[entityName].difficulty;
                    }
                    
                    // Generate tags
                    let tags = [categoryName, entityName, stainName.toLowerCase()];
                    if (rules.entities[entityName]?.tags) {
                      tags = [...tags, ...rules.entities[entityName].tags];
                    }
                    
                    // Generate teaching point
                    let teachingPoint = rules.entities[entityName]?.teachingPoint || '';
                    
                    // Create metadata object with standardized keys
                    const metadata = {
                      id: \`\${entityName}_\${stainName.toLowerCase()}_\${imgId}\`,
                      entity: entityName,
                      category: categoryName,
                      pattern: pattern,
                      cells: cells,
                      stain: stainName,
                      stainRole: stainRole,
                      organ: 'lung',
                      system: 'thoracic',
                      difficulty: difficulty,
                      path: \`/\${imgPath}\`,
                      tags: tags,
                      teachingPoint: teachingPoint,
                      source: 'open_archive',
                      filename: filename
                    };
                    
                    console.log(JSON.stringify(metadata));
                  } catch (e) {
                    console.error('Error generating metadata:', e.message);
                    process.exit(1);
                  }
                ")
                
                # Apply AI enrichment if enabled
                if [ "$USE_AI" = true ]; then
                  log "      🤖 Applying AI enrichment..."
                  img_metadata=$(node ai_enrichment.js "$img_metadata" 2>> "$LOG_FILE")
                fi
                
                echo "          $img_metadata" >> "$OUTPUT_FILE"
              fi
            done
          done
          
          echo "        ]" >> "$OUTPUT_FILE"
        fi
      done
      
      echo "      }" >> "$OUTPUT_FILE"
    fi
  done
  
  echo "    }" >> "$OUTPUT_FILE"
done

echo "  }" >> "$OUTPUT_FILE"
echo "}" >> "$OUTPUT_FILE"

log "✅ Image manifest generated: $OUTPUT_FILE"

# Validate JSON if requested
if [ "$VALIDATE" = true ]; then
  log "🔍 Validating JSON structure..."
  if command -v jq >/dev/null 2>&1; then
    if jq empty "$OUTPUT_FILE" 2>> "$LOG_FILE"; then
      log "✅ JSON validation passed"
    else
      log "❌ JSON validation failed"
      exit 1
    fi
  else
    log "⚠️ jq not available, skipping JSON validation"
  fi
  
  # Run validation script
  node validate_manifest.js 2>> "$LOG_FILE"
fi

# Generate statistics
log "📊 Generating manifest statistics..."
node -e "
  import fs from 'fs';
  
  const manifest = JSON.parse(fs.readFileSync('$OUTPUT_FILE', 'utf8'));
  
  let totalImages = 0;
  const categoryCounts = {};
  const entityCounts = {};
  const stainCounts = {};
  
  Object.entries(manifest.categories).forEach(([category, entities]) => {
    categoryCounts[category] = 0;
    Object.entries(entities).forEach(([entity, stains]) => {
      entityCounts[entity] = 0;
      Object.entries(stains).forEach(([stain, images]) => {
        if (!stainCounts[stain]) stainCounts[stain] = 0;
        stainCounts[stain] += images.length;
        entityCounts[entity] += images.length;
        categoryCounts[category] += images.length;
        totalImages += images.length;
      });
    });
  });
  
  console.log('📈 Manifest Statistics:');
  console.log(\`Total images: \${totalImages}\`);
  console.log('Categories:');
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    console.log(\`  \${cat}: \${count}\`);
  });
  console.log('Top entities:');
  Object.entries(entityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([entity, count]) => {
      console.log(\`  \${entity}: \${count}\`);
    });
  console.log('Stains:');
  Object.entries(stainCounts).forEach(([stain, count]) => {
    console.log(\`  \${stain}: \${count}\`);
  });
  
  // Save statistics
  fs.writeFileSync(
    '$(dirname "$OUTPUT_FILE")/manifest_stats.json',
    JSON.stringify({
      generated: manifest.generated,
      totalImages,
      categoryCounts,
      entityCounts,
      stainCounts
    }, null, 2)
  );
" 2>> "$LOG_FILE"

log "🎉 Manifest generation complete!"