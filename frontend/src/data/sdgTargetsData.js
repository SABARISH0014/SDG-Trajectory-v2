/**
 * Comprehensive SDG Targets Database (All 17 Goals, Targets 1.1 to 17.19),
 * Metric Units, Polarities, Layman Impact Explanations, Formatting Helpers,
 * and Dynamic AI Insight Synthesis.
 */

export const ALL_SDG_TARGETS = {
  // Goal 1: No Poverty
  '1.1': { title: 'Eradicate Extreme Poverty', indicator: 'Poverty Headcount at $2.15/day', unit: '% of population', polarity: 'lower_is_better', impact: 'Eliminating extreme poverty ensures families can afford essential food, shelter, and medical care, laying the foundation for all human development.' },
  '1.2': { title: 'Halve Poverty in All Dimensions', indicator: 'Multidimensional Poverty Headcount', unit: '% of population', polarity: 'lower_is_better', impact: 'Reduces overlapping deprivations across healthcare, education, and living standards, lifting communities out of generational poverty.' },
  '1.3': { title: 'Implement Social Protection Systems', indicator: 'Social Protection Floor Coverage', unit: '% of population', polarity: 'higher_is_better', impact: 'Guarantees unemployment, pension, and disability safety nets so vulnerable households do not fall into crisis during economic shocks.' },
  '1.4': { title: 'Equal Rights to Ownership & Basic Services', indicator: 'Basic Services & Land Rights Access', unit: 'Index (0–100)', polarity: 'higher_is_better', impact: 'Secures land rights, financial tools, and public utilities for marginalized populations, empowering self-sufficient livelihoods.' },
  '1.5': { title: 'Build Resilience to Climate & Economic Disasters', indicator: 'Disaster Affected Persons', unit: 'per 100k population', polarity: 'lower_is_better', impact: 'Strengthens community disaster defenses and insurance so extreme climate events do not wipe out household savings and assets.' },
  '1.a': { title: 'Mobilize Resources for Poverty Programs', indicator: 'Official Development Assistance for Poverty', unit: '% of GDP', polarity: 'higher_is_better', impact: 'Channels national budget allocations and aid toward pro-poor public programs, schools, and health clinics.' },
  '1.b': { title: 'Create Pro-Poor Policy Frameworks', indicator: 'Pro-Poor Public Spending Allocation', unit: '% of government spending', polarity: 'higher_is_better', impact: 'Enacts legislative frameworks prioritizing the economic empowerment of disadvantaged demographics and rural communities.' },

  // Goal 2: Zero Hunger
  '2.1': { title: 'Universal Access to Safe & Nutritious Food', indicator: 'Prevalence of Undernourishment', unit: '% of population', polarity: 'lower_is_better', impact: 'Guarantees everyone has reliable access to sufficient, nutritious food, eliminating chronic starvation and malnutrition.' },
  '2.2': { title: 'End All Forms of Malnutrition', indicator: 'Prevalence of Stunting in Children Under 5', unit: '% of children', polarity: 'lower_is_better', impact: 'Eliminates childhood wasting and stunting, protecting early cognitive growth and long-term vitality.' },
  '2.3': { title: 'Double Smallholder Farmer Productivity', indicator: 'Smallholder Agricultural Yield & Income', unit: 'Index (0–100)', polarity: 'higher_is_better', impact: 'Boosts smallholder farming yields and market access, strengthening domestic food supplies and rural incomes.' },
  '2.4': { title: 'Sustainable & Climate-Resilient Agriculture', indicator: 'Sustainable Agricultural Land Area', unit: '% of farmland', polarity: 'higher_is_better', impact: 'Promotes eco-friendly farming practices that preserve soil, conserve water, and resist climate droughts.' },
  '2.5': { title: 'Maintain Genetic Diversity of Crops & Livestock', indicator: 'Conserved Plant & Animal Genetic Resources', unit: 'Index (0–100)', polarity: 'higher_is_better', impact: 'Safeguards seed and livestock diversity, protecting global food security against pests and climate shocks.' },
  '2.a': { title: 'Invest in Rural Agricultural Infrastructure', indicator: 'Agriculture Orientation Index for Gov Spending', unit: 'Ratio score', polarity: 'higher_is_better', impact: 'Directs public investment into rural roads, cold storage, and irrigation, minimizing post-harvest food losses.' },
  '2.b': { title: 'Correct Agricultural Trade Distortions', indicator: 'Agricultural Export Subsidies', unit: 'Million USD', polarity: 'lower_is_better', impact: 'Removes market distortions and unfair subsidies, enabling developing farmers to trade fairly in global food markets.' },
  '2.c': { title: 'Ensure Stable Food Commodity Markets', indicator: 'Food Price Volatility Index', unit: 'Index score', polarity: 'lower_is_better', impact: 'Restricts extreme food price swings, ensuring staple food remains affordable for low-income households.' },

  // Goal 3: Good Health and Well-being
  '3.1': { title: 'Reduce Global Maternal Mortality', indicator: 'Maternal Mortality Ratio', unit: 'deaths per 100k live births', polarity: 'lower_is_better', impact: 'Expands skilled prenatal and emergency obstetric care, keeping mothers safe throughout pregnancy and childbirth.' },
  '3.2': { title: 'End Preventable Newborn & Child Deaths', indicator: 'Under-5 Child Mortality Rate', unit: 'deaths per 1,000 live births', polarity: 'lower_is_better', impact: 'Prevents childhood fatalities from treatable conditions through vaccinations, clean water, and neonatal care.' },
  '3.3': { title: 'End Epidemics of Communicable Diseases', indicator: 'Infectious Disease Incidence (HIV, TB, Malaria)', unit: 'cases per 1,000 population', polarity: 'lower_is_better', impact: 'Halts the spread of deadly infectious epidemics through treatments, vector control, and public health campaigns.' },
  '3.4': { title: 'Reduce Non-Communicable Diseases & Promote Mental Health', indicator: 'Premature NCD Mortality Rate (Cardio, Cancer, Diabetes)', unit: '% probability', polarity: 'lower_is_better', impact: 'Expands early screening, healthy lifestyle education, and mental healthcare services nationwide.' },
  '3.5': { title: 'Strengthen Substance Abuse Prevention & Treatment', indicator: 'Substance Use Treatment Coverage', unit: '% receiving treatment', polarity: 'higher_is_better', impact: 'Provides accessible rehabilitation and medical support for individuals struggling with narcotics or alcohol abuse.' },
  '3.6': { title: 'Halve Global Road Traffic Deaths & Injuries', indicator: 'Road Traffic Fatalities Rate', unit: 'deaths per 100k population', polarity: 'lower_is_better', impact: 'Enforces vehicle safety standards, speed limits, and pedestrian infrastructure to save lives on roadways.' },
  '3.7': { title: 'Universal Access to Reproductive Healthcare', indicator: 'Family Planning Met with Modern Methods', unit: '% of women (15–49)', polarity: 'higher_is_better', impact: 'Empowers women and couples with family planning resources, reducing unintended pregnancies and health risks.' },
  '3.8': { title: 'Achieve Universal Health Coverage (UHC)', indicator: 'UHC Service Coverage Index', unit: 'Index (0–100)', polarity: 'higher_is_better', impact: 'Ensures everyone can access essential medical treatments without suffering catastrophic out-of-pocket poverty.' },
  '3.9': { title: 'Reduce Pollution-Related Illnesses & Deaths', indicator: 'Mortality Attributed to Air & Water Pollution', unit: 'deaths per 100k population', polarity: 'lower_is_better', impact: 'Cleans air, water, and soil from toxic chemicals, preventing chronic respiratory and cardiovascular illnesses.' },
  '3.a': { title: 'Enforce Tobacco Control Frameworks', indicator: 'Age-Standardized Tobacco Use Prevalence', unit: '% of population', polarity: 'lower_is_better', impact: 'Reduces tobacco consumption through taxation, public bans, and warnings, averting preventable cancers.' },
  '3.b': { title: 'Support Vaccine & Medicine Research & Access', indicator: 'Vaccine Coverage for Target Populations (DTP3/MCV2)', unit: '% coverage', polarity: 'higher_is_better', impact: 'Ensures life-saving vaccines and generic medicines are universally available and affordable to all nations.' },
  '3.c': { title: 'Increase Health Workforce Financing & Training', indicator: 'Health Worker Density (Doctors & Nurses)', unit: 'per 10,000 population', polarity: 'higher_is_better', impact: 'Trains and retains frontline healthcare workers to maintain resilient hospitals and clinics in every region.' },
  '3.d': { title: 'Strengthen Early Warning for Global Health Risks', indicator: 'International Health Regulations (IHR) Capacity', unit: 'Score (0–100)', polarity: 'higher_is_better', impact: 'Prepares national emergency response systems to detect and contain global pandemics before they spiral.' },

  // Goal 4: Quality Education
  '4.1': { title: 'Free, Equitable Primary & Secondary Education', indicator: 'School Completion Rate (Primary & Secondary)', unit: '% of children', polarity: 'higher_is_better', impact: 'Guarantees every child completes 12 years of free, quality schooling with foundational literacy and numeracy.' },
  '4.2': { title: 'Universal Early Childhood Development & Pre-Primary', indicator: 'Pre-Primary Education Participation Rate', unit: '% of children (age 3–5)', polarity: 'higher_is_better', impact: 'Builds early cognitive, emotional, and social foundations, significantly closing socio-economic achievement gaps.' },
  '4.3': { title: 'Equal Access to Technical, Vocational & Higher Education', indicator: 'Tertiary Education Gross Enrollment Ratio', unit: '% gross enrollment', polarity: 'higher_is_better', impact: 'Opens affordable pathways to university degrees and technical diplomas, expanding high-skilled career opportunities.' },
  '4.4': { title: 'Increase Skills for Decent Work & Entrepreneurship', indicator: 'Youth & Adult ICT / Technical Skill Proficiency', unit: '% proficient', polarity: 'higher_is_better', impact: 'Equips youth with digital and vocational skills matching the needs of modern industrial and knowledge economies.' },
  '4.5': { title: 'Eliminate Gender Disparities in Education', indicator: 'Gender Parity Index in Education Enrollment', unit: 'Ratio (1.0 = Parity)', polarity: 'higher_is_better', impact: 'Removes barriers preventing girls, indigenous youth, and children with disabilities from attending school.' },
  '4.6': { title: 'Universal Youth & Adult Literacy and Numeracy', indicator: 'Adult Literacy Rate (Ages 15+)', unit: '% literate', polarity: 'higher_is_better', impact: 'Empowers adults with basic reading and math skills, enhancing civic participation and employment security.' },
  '4.7': { title: 'Education for Sustainable Development & Global Citizenship', indicator: 'Mainstreaming of Global Citizenship Education', unit: 'Score (0–100)', polarity: 'higher_is_better', impact: 'Teaches climate awareness, human rights, and peaceful culture, inspiring responsible future leaders.' },
  '4.a': { title: 'Build Safe, Inclusive & Effective School Facilities', indicator: 'Schools with Basic Electricity, Water & Internet', unit: '% of schools', polarity: 'higher_is_better', impact: 'Equips school buildings with clean sanitation, digital computers, and safe accessible classrooms.' },
  '4.b': { title: 'Expand Higher Education Scholarships', indicator: 'Scholarship Aid to Developing Countries', unit: 'Million USD', polarity: 'higher_is_better', impact: 'Funds scholarships for students from developing nations to study engineering, science, and public health.' },
  '4.c': { title: 'Increase Supply of Qualified Teachers', indicator: 'Proportion of Trained Teachers in Primary/Secondary', unit: '% certified teachers', polarity: 'higher_is_better', impact: 'Invests in comprehensive teacher training to raise educational quality and student comprehension across classrooms.' },

  // Goal 5: Gender Equality
  '5.1': { title: 'End Discrimination Against Women & Girls', indicator: 'Legal Frameworks Promoting Gender Equality', unit: 'Score (0–100)', polarity: 'higher_is_better', impact: 'Dismantles institutional and legal discrimination, ensuring equal civil, property, and economic rights for women.' },
  '5.2': { title: 'Eliminate Violence Against Women & Girls', indicator: 'Prevalence of Intimate Partner Violence', unit: '% of women (15–49)', polarity: 'lower_is_better', impact: 'Stops domestic abuse, human trafficking, and sexual exploitation through law enforcement and protective shelters.' },
  '5.3': { title: 'Eliminate Child Marriage & Female Genital Mutilation', indicator: 'Women Married Before Age 18', unit: '% of women', polarity: 'lower_is_better', impact: 'Protects young girls from forced early marriage and harmful traditional practices, keeping them in school.' },
  '5.4': { title: 'Value Unpaid Care & Promote Shared Domestic Work', indicator: 'Time Spent on Unpaid Domestic & Care Work', unit: '% of daily hours', polarity: 'lower_is_better', impact: 'Provides public childcare and eldercare services, reducing the disproportionate domestic burden on women.' },
  '5.5': { title: 'Ensure Full Participation in Leadership & Politics', indicator: 'Women in National Parliaments & Senior Management', unit: '% of leadership roles', polarity: 'higher_is_better', impact: 'Elevates female representation in government parliaments, executive boards, and community organizations.' },
  '5.6': { title: 'Universal Access to Reproductive Rights & Health', indicator: 'Women Making Informed Reproductive Decisions', unit: '% of women', polarity: 'higher_is_better', impact: 'Upholds bodily autonomy and access to reproductive healthcare information and services.' },
  '5.a': { title: 'Equal Rights to Economic Resources & Property', indicator: 'Women with Land Ownership & Agricultural Rights', unit: '% of land owners', polarity: 'higher_is_better', impact: 'Grants women equal inheritance, land tenure, and credit access, unlocking immense agricultural productivity.' },
  '5.b': { title: 'Empower Women Through Technology', indicator: 'Women Owning Mobile Phones & Digital Access', unit: '% of women', polarity: 'higher_is_better', impact: 'Bridges the digital gender divide with smartphone and internet access, enabling mobile banking and e-learning.' },
  '5.c': { title: 'Enforce Sound Policies & Legislation for Equality', indicator: 'Systems Tracking Public Allocations for Gender Equality', unit: '% compliance', polarity: 'higher_is_better', impact: 'Integrates gender-responsive budgeting across all government ministries and public investment plans.' },

  // Goal 6: Clean Water and Sanitation
  '6.1': { title: 'Safe & Affordable Drinking Water for All', indicator: 'Population Using Safely Managed Drinking Water', unit: '% of population', polarity: 'higher_is_better', impact: 'Delivers clean piped water directly to homes and schools, stopping waterborne illnesses and freeing daily time.' },
  '6.2': { title: 'Adequate Sanitation & End Open Defecation', indicator: 'Population Using Safely Managed Sanitation', unit: '% of population', polarity: 'higher_is_better', impact: 'Provides private flush toilets and handwashing facilities, eliminating open defecation and protecting community dignity.' },
  '6.3': { title: 'Improve Water Quality & Treat Wastewater', indicator: 'Safely Treated Domestic & Industrial Wastewater', unit: '% of wastewater', polarity: 'higher_is_better', impact: 'Stops untreated toxic industrial effluents from contaminating freshwater rivers, lakes, and aquifers.' },
  '6.4': { title: 'Increase Water-Use Efficiency & Address Scarcity', indicator: 'Water Stress (Freshwater Withdrawal as % of Available)', unit: '% of available water', polarity: 'lower_is_better', impact: 'Modernizes irrigation and industrial water recycling to prevent severe municipal water shortages.' },
  '6.5': { title: 'Implement Integrated Water Resources Management', indicator: 'Integrated Water Management Degree', unit: 'Score (0–100)', polarity: 'higher_is_better', impact: 'Coordinates watershed and river basin governance across administrative borders and industries.' },
  '6.6': { title: 'Protect & Restore Water-Related Ecosystems', indicator: 'Extent of Water Ecosystems (Wetlands, Rivers, Lakes)', unit: '% change in extent', polarity: 'higher_is_better', impact: 'Restores natural wetlands, lakes, and forests that naturally filter rainwater and sustain biodiversity.' },
  '6.a': { title: 'Expand International Water & Sanitation Cooperation', indicator: 'Water-Related Official Development Assistance', unit: 'Million USD', polarity: 'higher_is_better', impact: 'Funds water desalination, rainwater harvesting, and sanitation treatment plants in developing regions.' },
  '6.b': { title: 'Support Local Community Water Management', indicator: 'Local Community Participation in Water Management', unit: '% of administrative units', polarity: 'higher_is_better', impact: 'Involves rural villages and urban neighborhood associations in maintaining local wells and pipes.' },

  // Goal 7: Affordable and Clean Energy
  '7.1': { title: 'Universal Access to Modern Energy Services', indicator: 'Access to Electricity & Clean Cooking Fuels', unit: '% of population', polarity: 'higher_is_better', impact: 'Connects every home to reliable electricity and clean stoves, eliminating dangerous indoor woodsmoke inhalation.' },
  '7.2': { title: 'Increase Global Share of Renewable Energy', indicator: 'Renewable Energy Share in Final Consumption', unit: '% of total energy', polarity: 'higher_is_better', impact: 'Rapidly expands solar, wind, geothermal, and hydro generation to replace polluting fossil fuels.' },
  '7.3': { title: 'Double the Rate of Energy Efficiency', indicator: 'Energy Intensity Level of Primary Energy', unit: 'MJ per USD GDP', polarity: 'lower_is_better', impact: 'Adopts energy-efficient building codes, electric vehicles, and smart machinery, lowering electricity demand.' },
  '7.a': { title: 'Promote Clean Energy Research & Investment', indicator: 'International Financial Flows for Clean Energy', unit: 'Million USD', polarity: 'higher_is_better', impact: 'Attracts capital investment for green hydrogen, battery storage, and smart grid transmission lines.' },
  '7.b': { title: 'Expand Energy Infrastructure in Developing Countries', indicator: 'Installed Renewable Energy Generating Capacity', unit: 'Watts per capita', polarity: 'higher_is_better', impact: 'Builds modern electricity grids and off-grid mini solar systems in remote islands and landlocked regions.' },

  // Goal 8: Decent Work and Economic Growth
  '8.1': { title: 'Sustain Per Capita Economic Growth', indicator: 'Annual Growth Rate of Real GDP per Capita', unit: '% annual growth', polarity: 'higher_is_better', impact: 'Drives sustainable economic expansion, generating public tax revenues to reinvest in social infrastructure.' },
  '8.2': { title: 'Diversify, Innovate & Upgrade Economic Productivity', indicator: 'Annual Growth Rate of Real GDP per Employed Person', unit: '% productivity growth', polarity: 'higher_is_better', impact: 'Shifts economies into high-value manufacturing and software sectors, boosting worker productivity and wages.' },
  '8.3': { title: 'Promote Job Creation & Support Small Enterprises', indicator: 'Proportion of Informal Employment in Total Employment', unit: '% of workforce', polarity: 'lower_is_better', impact: 'Transitions informal workers into formal registered jobs with fair contracts, healthcare, and credit access.' },
  '8.4': { title: 'Decouple Economic Growth from Environmental Degradation', indicator: 'Material Footprint per Unit of GDP', unit: 'kg per USD', polarity: 'lower_is_better', impact: 'Builds circular economies that produce goods using recycled resources rather than depleting nature.' },
  '8.5': { title: 'Full & Productive Employment with Equal Pay', indicator: 'Unemployment Rate (Total Labor Force)', unit: '% of labor force', polarity: 'lower_is_better', impact: 'Ensures everyone seeking employment finds dignified work with fair compensation and equal pay for women.' },
  '8.6': { title: 'Reduce Youth Not in Employment, Education or Training', indicator: 'Youth NEET Rate (Ages 15–24)', unit: '% of youth', polarity: 'lower_is_better', impact: 'Connects young graduates to internships, apprenticeships, and vocational training to launch their careers.' },
  '8.7': { title: 'End Modern Slavery, Forced Labor & Child Labor', indicator: 'Children Engaged in Economic Child Labor', unit: '% of children (5–17)', polarity: 'lower_is_better', impact: 'Rescues children from hazardous factory and farm labor, returning them to classroom education.' },
  '8.8': { title: 'Protect Labor Rights & Safe Working Environments', indicator: 'Frequency Rates of Fatal Occupational Injuries', unit: 'per 100k workers', polarity: 'lower_is_better', impact: 'Enforces workplace occupational safety standards and union rights, preventing factory and construction injuries.' },
  '8.9': { title: 'Promote Sustainable Tourism That Creates Jobs', indicator: 'Tourism Direct GDP as % of Total GDP', unit: '% of GDP', polarity: 'higher_is_better', impact: 'Grows eco-tourism that showcases local heritage while providing sustainable income for local guides and artisans.' },
  '8.10': { title: 'Expand Access to Banking & Financial Services', indicator: 'Adults with Bank Account or Mobile Money Service', unit: '% of adults (15+)', polarity: 'higher_is_better', impact: 'Ensures everyone can securely save money, receive digital wages, and obtain small enterprise loans.' },
  '8.a': { title: 'Increase Aid for Trade Support', indicator: 'Aid for Trade Commitments & Disbursements', unit: 'Million USD', polarity: 'higher_is_better', impact: 'Helps developing nations upgrade customs logistics, ports, and trade standards to export worldwide.' },
  '8.b': { title: 'Develop Global Strategy for Youth Employment', indicator: 'National Strategy for Youth Employment Operational', unit: 'Status (0–100)', polarity: 'higher_is_better', impact: 'Creates dedicated government budgets and incubators aimed at creating tech and green jobs for young citizens.' },

  // Goal 9: Industry, Innovation and Infrastructure
  '9.1': { title: 'Develop Resilient & Inclusive Infrastructure', indicator: 'Rural Population with Access to All-Season Roads', unit: '% of rural population', polarity: 'higher_is_better', impact: 'Connects rural villages to hospitals, schools, and city markets through paved roads and freight rail.' },
  '9.2': { title: 'Promote Inclusive & Sustainable Industrialization', indicator: 'Manufacturing Value Added as % of GDP', unit: '% of GDP', polarity: 'higher_is_better', impact: 'Expands domestic manufacturing capacity to create high-paying engineering, processing, and assembly jobs.' },
  '9.3': { title: 'Increase Small Enterprise Access to Financial Services', indicator: 'Small-Scale Industries with Loan or Line of Credit', unit: '% of small businesses', polarity: 'higher_is_better', impact: 'Provides microloans and working capital to small machine shops and startups to purchase modern equipment.' },
  '9.4': { title: 'Upgrade Industries for Sustainability & Low Carbon', indicator: 'CO2 Emissions per Unit of Manufacturing Value Added', unit: 'kg CO2 per USD', polarity: 'lower_is_better', impact: 'Retrofits factories with energy-efficient furnaces, solar rooftops, and closed-loop waste recycling.' },
  '9.5': { title: 'Enhance Scientific Research & Innovation Capacity', indicator: 'Research & Development (R&D) Expenditure', unit: '% of GDP', polarity: 'higher_is_better', impact: 'Invests in universities, scientific laboratories, and patents to develop homegrown technological breakthroughs.' },
  '9.a': { title: 'Facilitate Sustainable Infrastructure in Africa & LDCs', indicator: 'Total International Support to Infrastructure', unit: 'Million USD', polarity: 'higher_is_better', impact: 'Provides grants and concessional loans to build clean electricity grids and bridges in developing nations.' },
  '9.b': { title: 'Support Domestic Technology & Industrial Diversification', indicator: 'Medium & High-Tech Industry Value Added', unit: '% of manufacturing', polarity: 'higher_is_better', impact: 'Shifts industrial production toward advanced electronics, renewable technology, and biotechnology.' },
  '9.c': { title: 'Universal & Affordable Access to Information (ICT)', indicator: 'Population Covered by 4G / 5G Mobile Network', unit: '% of population', polarity: 'higher_is_better', impact: 'Expands high-speed cellular networks to remote areas, enabling telehealth, remote learning, and digital commerce.' },

  // Goal 10: Reduced Inequalities
  '10.1': { title: 'Sustain Income Growth of the Bottom 40%', indicator: 'Income Growth of Bottom 40% vs National Average', unit: '% difference', polarity: 'higher_is_better', impact: 'Ensures economic prosperity disproportionately benefits low-income earners, closing the wealth divide.' },
  '10.2': { title: 'Promote Universal Social, Economic & Political Inclusion', indicator: 'Population Living Below 50% of Median Income', unit: '% of population', polarity: 'lower_is_better', impact: 'Eliminates marginalization of ethnic minorities, women, and persons with disabilities across society.' },
  '10.3': { title: 'Ensure Equal Opportunity & End Discrimination', indicator: 'Population Reporting Personally Felt Discrimination', unit: '% of population', polarity: 'lower_is_better', impact: 'Enforces strict anti-discrimination laws in hiring, housing, and government services.' },
  '10.4': { title: 'Adopt Fiscal, Wage & Social Protection Policies', indicator: 'Labor Share of GDP (Wages & Social Protection)', unit: '% of GDP', polarity: 'higher_is_better', impact: 'Raises minimum wages and progressive tax policies so workers receive a fair share of national economic output.' },
  '10.5': { title: 'Improve Regulation of Global Financial Markets', indicator: 'Financial Soundness Indicators & Capital Ratios', unit: '% compliance', polarity: 'higher_is_better', impact: 'Regulates banking and derivatives markets to prevent predatory lending, capital flight, and economic collapses.' },
  '10.6': { title: 'Ensure Enhanced Representation in Global Institutions', indicator: 'Developing Country Voting Share in IMF & World Bank', unit: '% voting share', polarity: 'higher_is_better', impact: 'Gives emerging economies a fair voice and vote in shaping global financial and monetary policies.' },
  '10.7': { title: 'Facilitate Safe, Orderly & Responsible Migration', indicator: 'Recruitment Cost Borne by Employee as % of Income', unit: 'Months of income', polarity: 'lower_is_better', impact: 'Protects migrant workers from extortionate recruitment fees, human trafficking, and wage theft.' },
  '10.a': { title: 'Implement Special & Differential Trade Treatment', indicator: 'Tariff Lines Applied to LDC Imports with Zero Duty', unit: '% duty-free lines', polarity: 'higher_is_better', impact: 'Grants zero-tariff access for exports from the least developed countries into global consumer markets.' },
  '10.b': { title: 'Encourage Financial Flows & Foreign Direct Investment', indicator: 'Total Resource Flows for Development (FDI + Aid)', unit: 'Million USD', polarity: 'higher_is_better', impact: 'Attracts responsible foreign investment into sectors that create jobs in low-income regions.' },
  '10.c': { title: 'Reduce Migrant Remittance Transaction Costs', indicator: 'Average Transaction Cost of Migrant Remittances', unit: '% of amount sent', polarity: 'lower_is_better', impact: 'Cuts remittance fees charged by wire companies, keeping more money in the hands of recipient families.' },

  // Goal 11: Sustainable Cities and Communities
  '11.1': { title: 'Safe, Affordable Housing & Upgrade Slums', indicator: 'Urban Population Living in Slums / Informal Settlements', unit: '% of urban population', polarity: 'lower_is_better', impact: 'Upgrades informal settlements with sturdy homes, clean sanitation, and electricity, guaranteeing housing dignity.' },
  '11.2': { title: 'Accessible & Sustainable Public Transport Systems', indicator: 'Population with Convenient Access to Public Transport', unit: '% of urban population', polarity: 'higher_is_better', impact: 'Expands metro rail and rapid bus routes, reducing highway traffic jams and transport costs for commuters.' },
  '11.3': { title: 'Inclusive & Sustainable Urbanization Planning', indicator: 'Ratio of Land Consumption Rate to Population Growth', unit: 'Ratio score', polarity: 'lower_is_better', impact: 'Prevents chaotic urban sprawl by planning compact, walkable, and green residential neighborhoods.' },
  '11.4': { title: 'Protect Cultural & Natural Heritage', indicator: 'Per Capita Expenditure on Cultural & Natural Heritage', unit: 'USD per capita', polarity: 'higher_is_better', impact: 'Preserves historic monuments, indigenous cultural sites, and urban parks for future generations.' },
  '11.5': { title: 'Reduce Losses from Urban Disasters & Floods', indicator: 'Direct Economic Loss from Disasters in Urban Areas', unit: '% of local GDP', polarity: 'lower_is_better', impact: 'Builds storm runoff canals, seawalls, and earthquake-resistant buildings to safeguard city dwellers.' },
  '11.6': { title: 'Reduce Environmental Impact of Cities (Air & Waste)', indicator: 'Urban Mean PM2.5 Air Pollution Concentration', unit: 'µg/m³ air concentration', polarity: 'lower_is_better', impact: 'Enforces municipal waste collection and curbs vehicular exhaust, drastically reducing city smog and asthma.' },
  '11.7': { title: 'Universal Access to Safe, Green Public Spaces', indicator: 'Open Space for Public Use in Built-Up Urban Areas', unit: '% of urban land', polarity: 'higher_is_better', impact: 'Creates inclusive tree-lined parks and pedestrian plazas for recreation, physical exercise, and children.' },
  '11.a': { title: 'Support Positive Urban-Rural Economic Linkages', indicator: 'National Urban Policies Addressing Regional Planning', unit: 'Status score (0–100)', polarity: 'higher_is_better', impact: 'Connects city supply chains with rural food growers, creating mutual economic growth.' },
  '11.b': { title: 'Implement Disaster Risk Reduction in Cities', indicator: 'Cities with Local Disaster Risk Reduction Strategies', unit: '% of cities', polarity: 'higher_is_better', impact: 'Equips mayors and local fire departments with flood evacuation plans and early warning sirens.' },
  '11.c': { title: 'Support Sustainable Building with Local Materials', indicator: 'Sustainable Local Material Use in Construction', unit: 'Index (0–100)', polarity: 'higher_is_better', impact: 'Encourages energy-efficient buildings using local timber, stone, and bamboo rather than high-carbon concrete.' },

  // Goal 12: Responsible Consumption and Production
  '12.1': { title: 'Implement 10-Year Framework on Sustainable Consumption', indicator: 'National Sustainable Consumption & Production Plans', unit: 'Status score (0–100)', polarity: 'higher_is_better', impact: 'Coordinates national policies to reduce consumer waste and promote sustainable lifestyle habits.' },
  '12.2': { title: 'Sustainable Management & Efficient Use of Resources', indicator: 'Material Footprint per Capita', unit: 'metric tons per capita', polarity: 'lower_is_better', impact: 'Lowers unnecessary natural resource extraction by maximizing industrial recycling and circular product design.' },
  '12.3': { title: 'Halve Global Per Capita Food Waste', indicator: 'Food Waste & Post-Harvest Food Loss Index', unit: '% of food produced', polarity: 'lower_is_better', impact: 'Prevents edible food from ending up in landfills through better refrigerated transport and retail food donation.' },
  '12.4': { title: 'Environmentally Sound Management of Chemicals', indicator: 'Hazardous Waste Generated & Treated Safely', unit: 'kg per capita', polarity: 'higher_is_better', impact: 'Enforces safe disposal of industrial solvents, batteries, and e-waste, preventing groundwater poisoning.' },
  '12.5': { title: 'Substantially Reduce Waste Generation Through Recycling', indicator: 'National Municipal Recycling Rate', unit: '% of waste recycled', polarity: 'higher_is_better', impact: 'Builds modern composting and materials recovery facilities, turning discarded glass, paper, and metal into new goods.' },
  '12.6': { title: 'Encourage Companies to Adopt Sustainability Reporting', indicator: 'Companies Publishing ESG Sustainability Reports', unit: 'Number of companies', polarity: 'higher_is_better', impact: 'Mandates transparency from large corporations regarding carbon footprints and fair labor practices.' },
  '12.7': { title: 'Promote Sustainable Public Procurement Practices', indicator: 'Sustainable Public Procurement Implementation', unit: 'Score (0–100)', polarity: 'higher_is_better', impact: 'Uses government purchasing power to buy recycled paper, energy-efficient vehicles, and organic school meals.' },
  '12.8': { title: 'Ensure Universal Awareness for Sustainable Lifestyles', indicator: 'Public Understanding of Sustainable Development', unit: 'Score (0–100)', polarity: 'higher_is_better', impact: 'Educates consumers on energy saving, composting, and reducing single-use packaging.' },
  '12.a': { title: 'Support Scientific Capacity for Sustainable Consumption', indicator: 'Renewable Energy Capacity for Developing Nations', unit: 'Watts per capita', polarity: 'higher_is_better', impact: 'Assists developing research labs in developing biodegradable plastics and clean industrial processes.' },
  '12.b': { title: 'Develop Tools to Monitor Sustainable Tourism Impacts', indicator: 'Sustainable Tourism Strategy Implementation', unit: 'Status score (0–100)', polarity: 'higher_is_better', impact: 'Monitors the environmental impact of tourist resorts on local freshwater and marine ecosystems.' },
  '12.c': { title: 'Rationalize Inefficient Fossil Fuel Subsidies', indicator: 'Fossil Fuel Subsidies per Unit of GDP', unit: '% of GDP', polarity: 'lower_is_better', impact: 'Phases out artificial subsidies on coal and oil, redirecting public funds toward solar energy and social welfare.' },

  // Goal 13: Climate Action
  '13.1': { title: 'Strengthen Resilience to Climate-Related Hazards', indicator: 'Disaster Risk Reduction Strategy Score', unit: 'Score (0–100)', polarity: 'higher_is_better', impact: 'Builds early warning sirens, flood barriers, and emergency shelters to protect citizens from typhoons and wildfires.' },
  '13.2': { title: 'Integrate Climate Change Measures into Policies', indicator: 'Carbon Dioxide (CO2) Emissions per Capita', unit: 'metric tons CO2 / capita', polarity: 'lower_is_better', impact: 'Commits nations to net-zero carbon pathways, transforming energy, transport, and manufacturing into clean sectors.' },
  '13.3': { title: 'Improve Climate Education, Awareness & Human Capacity', indicator: 'Integration of Climate Change into School Curricula', unit: 'Score (0–100)', polarity: 'higher_is_better', impact: 'Prepares youth with climate science and green skills to lead ecological transition in their careers.' },
  '13.a': { title: 'Fulfill UN Climate Fund Commitments', indicator: 'International Climate Finance Mobilized', unit: 'Billion USD', polarity: 'higher_is_better', impact: 'Mobilizes $100B+ annually from developed nations to fund green transition in climate-vulnerable countries.' },
  '13.b': { title: 'Promote Mechanisms for Climate Planning in LDCs', indicator: 'Local & National Adaptation Plans in LDCs', unit: 'Number of plans', polarity: 'higher_is_better', impact: 'Empowers small island nations and vulnerable populations with localized adaptation plans against sea level rise.' },

  // Goal 14: Life Below Water
  '14.1': { title: 'Prevent & Significantly Reduce Marine Pollution', indicator: 'Coastal Marine Eutrophication & Plastic Debris', unit: 'Index (0–100)', polarity: 'lower_is_better', impact: 'Bans single-use plastic waste and agricultural runoff from entering streams and choking ocean wildlife.' },
  '14.2': { title: 'Protect & Restore Coastal & Marine Ecosystems', indicator: 'Marine Protected Areas (MPAs) under Management', unit: '% of territorial waters', polarity: 'higher_is_better', impact: 'Designates ocean sanctuaries where coral reefs, mangroves, and kelp forests can recover and thrive.' },
  '14.3': { title: 'Minimize & Address Ocean Acidification', indicator: 'Average Ocean Surface pH Acidity Level', unit: 'pH level', polarity: 'higher_is_better', impact: 'Lowers global carbon emissions to prevent ocean acidification that dissolves shellfish and coral skeletons.' },
  '14.4': { title: 'End Overfishing & Restore Fish Stocks', indicator: 'Fish Stocks within Biologically Sustainable Levels', unit: '% of fish stocks', polarity: 'higher_is_better', impact: 'Enforces science-based catch quotas and bans destructive bottom trawling to restore global fish populations.' },
  '14.5': { title: 'Conserve at Least 10% of Coastal & Marine Areas', indicator: 'Coverage of Protected Marine Biosphere Reserves', unit: '% of marine area', polarity: 'higher_is_better', impact: 'Preserves critical ocean breeding grounds, ensuring long-term fish abundance for coastal communities.' },
  '14.6': { title: 'Prohibit Destructive Fisheries Subsidies', indicator: 'Progress in Combating Illegal & Unreported Fishing', unit: 'Score (1–5)', polarity: 'higher_is_better', impact: 'Eliminates subsidies for industrial mega-trawlers that plunder distant waters and deplete artisanal fishing stocks.' },
  '14.7': { title: 'Increase Economic Benefits for SIDS from Oceans', indicator: 'Sustainable Fisheries as % of Small Island GDP', unit: '% of GDP', polarity: 'higher_is_better', impact: 'Supports local sustainable tuna fisheries and eco-diving tourism across small island developing states.' },
  '14.a': { title: 'Increase Scientific Knowledge & Research for Oceans', indicator: 'National Budget Allocated to Marine Research', unit: '% of research budget', polarity: 'higher_is_better', impact: 'Funds oceanographic research vessels and satellite monitoring to track marine biodiversity and currents.' },
  '14.b': { title: 'Provide Access for Small-Scale Artisanal Fishers', indicator: 'Legal Protection for Small-Scale Artisanal Fishers', unit: 'Score (0–100)', polarity: 'higher_is_better', impact: 'Protects the exclusive coastal fishing rights of traditional artisanal fishers from foreign mega-fleets.' },
  '14.c': { title: 'Implement International Law of the Sea (UNCLOS)', indicator: 'Ratification of UN Convention on Law of the Sea', unit: '% compliance', polarity: 'higher_is_better', impact: 'Upholds international treaties that govern the peaceful and ecological stewardship of international waters.' },

  // Goal 15: Life on Land
  '15.1': { title: 'Conserve & Restore Terrestrial & Freshwater Ecosystems', indicator: 'Forest Area as % of Total Land Area', unit: '% of land area', polarity: 'higher_is_better', impact: 'Halts deforestation and reforests degraded landscapes, protecting freshwater watersheds and soil fertility.' },
  '15.2': { title: 'End Deforestation & Restore Degraded Forests', indicator: 'Annual Net Forest Expansion Rate', unit: '% annual change', polarity: 'higher_is_better', impact: 'Enforces strict protections against illegal logging and promotes sustainable certified timber harvesting.' },
  '15.3': { title: 'Combat Desertification & Restore Degraded Land', indicator: 'Proportion of Land That is Degraded', unit: '% of total land', polarity: 'lower_is_better', impact: 'Plants green belts and restores depleted topsoils, stopping the spread of sand dunes into productive farmlands.' },
  '15.4': { title: 'Ensure the Conservation of Mountain Ecosystems', indicator: 'Mountain Green Cover & Biodiversity Index', unit: 'Index (0–100)', polarity: 'higher_is_better', impact: 'Protects alpine forests and glaciers that supply freshwater rivers to billions of downstream citizens.' },
  '15.5': { title: 'Halt the Loss of Biodiversity & Prevent Extinction', indicator: 'Red List Threatened Species Survival Index', unit: 'Index (0–1.0)', polarity: 'higher_is_better', impact: 'Prevents the extinction of endangered mammals, birds, and insects, keeping complex ecological food webs intact.' },
  '15.6': { title: 'Promote Fair Sharing of Genetic Resources Benefits', indicator: 'Nagoya Protocol Compliance on Genetic Resources', unit: '% compliance', polarity: 'higher_is_better', impact: 'Ensures indigenous communities receive fair compensation when pharmaceutical companies use local medicinal plants.' },
  '15.7': { title: 'End Poaching & Trafficking of Protected Species', indicator: 'Trade in Illegally Poached Wildlife Products', unit: 'Index score', polarity: 'lower_is_better', impact: 'Deploys anti-poaching park rangers and cracks down on international smuggling syndicates of ivory and exotic animals.' },
  '15.8': { title: 'Prevent & Control Invasive Alien Species', indicator: 'National Legislation Regulating Invasive Species', unit: 'Status score (0–100)', polarity: 'higher_is_better', impact: 'Quarantines agricultural ports to prevent invasive insects, weeds, and pests from decimating native wildlife.' },
  '15.9': { title: 'Integrate Ecosystem Values into National Planning', indicator: 'National Accounting Integrating Natural Capital Value', unit: 'Status score (0–100)', polarity: 'higher_is_better', impact: 'Accounts for the economic value of clean air, water, and forests within official national GDP calculations.' },
  '15.a': { title: 'Mobilize Financial Resources to Conserve Biodiversity', indicator: 'Official Development Assistance for Biodiversity', unit: 'Million USD', polarity: 'higher_is_better', impact: 'Channels global green funds into maintaining national nature parks and wildlife corridors.' },
  '15.b': { title: 'Finance Sustainable Forest Management', indicator: 'Investments in Community Agro-Forestry Projects', unit: 'Million USD', polarity: 'higher_is_better', impact: 'Provides loans and grants to rural communities that manage community forests without clear-cutting.' },
  '15.c': { title: 'Combat Poaching Through Community Support', indicator: 'Livelihoods Created by Wildlife Tourism in Reserves', unit: 'Number of jobs', polarity: 'higher_is_better', impact: 'Provides local jobs in wildlife conservation and safari guiding, turning local communities into passionate protectors.' },

  // Goal 16: Peace, Justice and Strong Institutions
  '16.1': { title: 'Significantly Reduce All Forms of Violence', indicator: 'Intentional Homicide Rate', unit: 'homicides per 100k people', polarity: 'lower_is_better', impact: 'Eliminates violent street crime, gang warfare, and armed conflict, allowing neighborhoods to thrive safely.' },
  '16.2': { title: 'End Abuse, Exploitation, Trafficking & Torture of Children', indicator: 'Children Experiencing Violent Discipline or Abuse', unit: '% of children (1–14)', polarity: 'lower_is_better', impact: 'Protects children from physical abuse, labor exploitation, and illegal trafficking rings.' },
  '16.3': { title: 'Promote the Rule of Law & Equal Access to Justice', indicator: 'Unsentenced Detainees as % of Overall Prison Population', unit: '% of prison pop.', polarity: 'lower_is_better', impact: 'Guarantees legal defense, speedy public trials, and transparent judicial systems for all citizens.' },
  '16.4': { title: 'Combat Illicit Financial Flows & Arms Trafficking', indicator: 'Illicit Financial Outflows & Seized Small Arms', unit: 'Million USD', polarity: 'lower_is_better', impact: 'Closes tax havens, seizes black-market weapons, and stops illicit money laundering by criminal cartels.' },
  '16.5': { title: 'Substantially Reduce Corruption & Bribery', indicator: 'Businesses Reporting Bribery Requests by Public Officials', unit: '% of businesses', polarity: 'lower_is_better', impact: 'Punishes government embezzlement and bribery, ensuring public tax funds actually reach schools and clinics.' },
  '16.6': { title: 'Develop Effective, Accountable & Transparent Institutions', indicator: 'Primary Government Spending Reliability & Transparency', unit: '% of approved budget', polarity: 'higher_is_better', impact: 'Publishes public government budgets and audit reports, maintaining trust between citizens and state officials.' },
  '16.7': { title: 'Ensure Responsive, Inclusive & Representative Decision-Making', indicator: 'Proportion of Population Satisfied with Public Services', unit: '% satisfied', polarity: 'higher_is_better', impact: 'Gives citizens a direct voice in city councils, public hearings, and municipal policymaking.' },
  '16.8': { title: 'Broaden Participation of Developing Countries in Governance', indicator: 'Developing Country Voting Membership in Global Bodies', unit: '% voting share', polarity: 'higher_is_better', impact: 'Ensures emerging nations have a rightful seat at international diplomatic and economic negotiations.' },
  '16.9': { title: 'Provide Legal Identity & Birth Registration for All', indicator: 'Children Under 5 Registered with Civil Authority', unit: '% of children', polarity: 'higher_is_better', impact: 'Issues official birth certificates, enabling children to enroll in school, vote, and access healthcare.' },
  '16.10': { title: 'Ensure Public Access to Information & Protect Freedoms', indicator: 'Killings or Attacks on Journalists & Rights Defenders', unit: 'Recorded cases', polarity: 'lower_is_better', impact: 'Guarantees freedom of the press and public records access, protecting investigative journalists.' },
  '16.a': { title: 'Strengthen National Institutions to Prevent Violence', indicator: 'Independent National Human Rights Institution Status', unit: 'Grade (A/B/C)', polarity: 'higher_is_better', impact: 'Funds independent human rights ombudsmen and anti-terrorism police accountability units.' },
  '16.b': { title: 'Promote & Enforce Non-Discriminatory Laws', indicator: 'Laws Prohibiting Discrimination in Employment & Civil Life', unit: '% compliance', polarity: 'higher_is_better', impact: 'Enforces equal legal protections regardless of race, gender, religion, or sexual orientation.' },

  // Goal 17: Partnerships for the Goals
  '17.1': { title: 'Strengthen Domestic Resource Mobilization', indicator: 'Government Revenue as Proportion of GDP', unit: '% of GDP', polarity: 'higher_is_better', impact: 'Strengthens progressive tax administration, providing self-sustaining revenue for hospitals and public rail.' },
  '17.2': { title: 'Fulfill Official Development Assistance (ODA) Targets', indicator: 'Net ODA as % of Donor Country Gross National Income', unit: '% of GNI (Target 0.7%)', polarity: 'higher_is_better', impact: 'Encourages developed nations to fulfill their pledge of 0.7% GNI in development aid to low-income regions.' },
  '17.3': { title: 'Mobilize Additional Financial Resources for Developing Nations', indicator: 'Foreign Direct Investment (FDI) Inflows', unit: 'Billion USD', polarity: 'higher_is_better', impact: 'Attracts international sovereign wealth and green bonds into developing infrastructure projects.' },
  '17.4': { title: 'Assist Developing Countries in Debt Sustainability', indicator: 'Debt Service as % of Exports of Goods & Services', unit: '% of exports', polarity: 'lower_is_better', impact: 'Restructures unsustainable foreign debt to prevent sovereign debt crises and public austerity.' },
  '17.5': { title: 'Adopt & Implement Investment Promotion Regimes', indicator: 'National Investment Promotion Frameworks for LDCs', unit: 'Status score (0–100)', polarity: 'higher_is_better', impact: 'Offers tax guarantees and legal certainty to foreign companies investing in local clean technology.' },
  '17.6': { title: 'Enhance North-South & South-South Science Cooperation', indicator: 'Fixed Internet Broadband Subscriptions per 100 Inhabitants', unit: 'per 100 people', polarity: 'higher_is_better', impact: 'Facilitates scientific data sharing, open-access university research, and technology transfer.' },
  '17.7': { title: 'Promote Development & Transfer of Environmentally Sound Tech', indicator: 'Funding for Environmentally Sound Technology Transfer', unit: 'Million USD', polarity: 'higher_is_better', impact: 'Helps developing nations adopt patented solar manufacturing, water desalination, and battery tech.' },
  '17.8': { title: 'Fully Operationalize the Technology Bank for LDCs', indicator: 'Proportion of Individuals Using the Internet', unit: '% of population', polarity: 'higher_is_better', impact: 'Connects schools, clinics, and entrepreneurs to high-speed internet, democratizing digital skills.' },
  '17.9': { title: 'Enhance International Capacity-Building Support', indicator: 'Financial & Technical Assistance for Capacity-Building', unit: 'Million USD', polarity: 'higher_is_better', impact: 'Trains civil servants, doctors, and engineers to independently design and run public development programs.' },
  '17.10': { title: 'Promote Universal, Rules-Based Multilateral Trading System', indicator: 'Worldwide Weighted Tariff Average', unit: '% tariff', polarity: 'lower_is_better', impact: 'Reduces protectionist trade barriers under the World Trade Organization, expanding peaceful global commerce.' },
  '17.11': { title: 'Increase Exports of Developing Countries', indicator: 'Developing Country Share of Global Merchandise Exports', unit: '% global share', polarity: 'higher_is_better', impact: 'Enables emerging economies to export value-added manufactured goods to global consumer markets.' },
  '17.12': { title: 'Realize Timely Duty-Free & Quota-Free Market Access for LDCs', indicator: 'Average Tariffs Faced by Developing Country Exports', unit: '% tariff', polarity: 'lower_is_better', impact: 'Eliminates import duties on coffee, textiles, and agricultural goods exported from the poorest nations.' },
  '17.13': { title: 'Enhance Global Macroeconomic Stability', indicator: 'Macroeconomic Dashboard Policy Coherence Score', unit: 'Score (0–100)', polarity: 'higher_is_better', impact: 'Coordinates central bank interest rates and currency stability to avert global financial contagions.' },
  '17.14': { title: 'Enhance Policy Coherence for Sustainable Development', indicator: 'Mechanisms in Place for Policy Coherence', unit: '% compliance', polarity: 'higher_is_better', impact: 'Ensures economic, environmental, and trade policies reinforce each other rather than clash.' },
  '17.15': { title: 'Respect National Policy Space & Country Leadership', indicator: 'Development Interventions Using Country Results Frameworks', unit: '% of projects', polarity: 'higher_is_better', impact: 'Aligns international aid with each recipient nation’s sovereign development priorities.' },
  '17.16': { title: 'Enhance Global Partnership for Sustainable Development', indicator: 'Multi-Stakeholder Partnerships Active', unit: 'Number of partnerships', polarity: 'higher_is_better', impact: 'Unites governments, private tech companies, and NGOs to jointly finance massive clean energy projects.' },
  '17.17': { title: 'Encourage Effective Public, Public-Private & Civil Partnerships', indicator: 'Private Capital Mobilized for Sustainable Development', unit: 'Billion USD', polarity: 'higher_is_better', impact: 'Leverages public seed funding to unlock private institutional capital for hospitals and renewable grids.' },
  '17.18': { title: 'Enhance Capacity-Building for High-Quality Timely Data', indicator: 'National Statistical Capacity Index', unit: 'Score (0–100)', polarity: 'higher_is_better', impact: 'Funds national census bureaus to gather precise, disaggregated data on poverty, gender, and climate.' },
  '17.19': { title: 'Develop Measurements of Progress Beyond GDP', indicator: 'Countries Conducting Modern Population & Housing Census', unit: 'Status score (0–100)', polarity: 'higher_is_better', impact: 'Develops holistic well-being indicators measuring clean air, happiness, and health alongside economic GDP.' },
};

/**
 * Format any numerical indicator value cleanly with compact unit notations (k, M, B, %, etc.)
 */
export function formatMetricValue(value, fallbackUnit = '') {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  const num = Number(value);
  const absNum = Math.abs(num);

  if (absNum >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  }
  if (absNum >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  }
  if (absNum >= 1e4) {
    return `${(num / 1e3).toFixed(1)}k`;
  }
  if (Number.isInteger(num)) {
    return num.toString();
  }
  if (absNum < 0.01 && absNum > 0) {
    return num.toExponential(2);
  }
  return num.toFixed(2);
}

/**
 * Get comprehensive metadata for any target code
 */
export function getTargetDetails(targetCode, goalNumber = null) {
  if (ALL_SDG_TARGETS[targetCode]) {
    const data = ALL_SDG_TARGETS[targetCode];
    const goalNum = goalNumber || parseInt(targetCode?.split('.')[0], 10) || 1;
    return {
      code: targetCode,
      goalNumber: goalNum,
      goalName: `Goal ${goalNum}`,
      title: data.title,
      indicatorName: data.indicator,
      unit: data.unit,
      polarity: data.polarity,
      impactOnGoal: data.impact,
    };
  }

  const goalNum = goalNumber || parseInt(targetCode?.split('.')[0], 10) || 1;
  const isLowerBetter = ['1.1', '1.2', '1.5', '2.1', '2.2', '2.c', '3.1', '3.2', '3.3', '3.4', '3.6', '3.9', '3.a', '5.2', '5.3', '5.4', '6.4', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '9.4', '10.2', '10.3', '10.7', '10.c', '11.1', '11.3', '11.5', '11.6', '12.2', '12.3', '12.c', '13.2', '14.1', '15.3', '15.7', '16.1', '16.2', '16.3', '16.4', '16.5', '16.10', '17.4', '17.10', '17.12'].includes(targetCode);

  return {
    code: targetCode || `${goalNum}.1`,
    goalNumber: goalNum,
    goalName: `Goal ${goalNum}`,
    title: `Target ${targetCode || `${goalNum}.1`}`,
    indicatorName: `Core Development Indicator for SDG ${targetCode || `${goalNum}.1`}`,
    unit: isLowerBetter ? 'Rate / Count metric' : '% Progress / Index (0–100)',
    polarity: isLowerBetter ? 'lower_is_better' : 'higher_is_better',
    impactOnGoal: isLowerBetter
      ? `Reducing this indicator directly advances Goal ${goalNum} by eliminating critical systemic bottlenecks and protecting vulnerable populations.`
      : `Expanding this indicator serves as a positive catalyst for Goal ${goalNum}, enhancing public infrastructure and community resilience.`,
  };
}

/**
 * Generate a dynamic, layman-friendly AI insight synthesized for the specific
 * country, goal, target, and mathematical trajectory.
 */
export function generateDynamicLaymanInsight({
  countryName = 'The country',
  goalNumber = 1,
  goalName = 'Sustainable Development',
  targetCode = '1.1',
  status = 'On-track',
  chartData = [],
  policyMultiplier = 1.0,
}) {
  const details = getTargetDetails(targetCode, goalNumber);
  const statusStr = (status || '').toLowerCase();
  
  // Calculate trajectory metrics from chart data if available
  let baseVal = null;
  let predVal2030 = null;
  if (chartData && chartData.length > 0) {
    const actuals = chartData.filter(d => d.actualValue !== null && d.actualValue !== undefined);
    if (actuals.length > 0) {
      baseVal = actuals[0].actualValue;
    }
    const preds = chartData.filter(d => d.predictedValue !== null && d.predictedValue !== undefined);
    if (preds.length > 0) {
      predVal2030 = preds[preds.length - 1].predictedValue;
    }
  }

  const isLowerBetter = details.polarity === 'lower_is_better';
  const targetLabel = details.title;
  const unitLabel = details.unit;

  // Policy Simulator Scenario
  if (policyMultiplier !== 1.0) {
    if (policyMultiplier > 1.0) {
      const speedPct = Math.round((policyMultiplier - 1.0) * 100);
      return `Under an accelerated policy scenario (+${speedPct}% implementation speed), ${countryName} is positioned to achieve substantial progress in ${targetLabel.toLowerCase()} by 2030. Increased investment velocity directly strengthens Goal ${goalNumber} (${goalName}) and delivers faster tangible benefits for local communities.`;
    } else {
      const slowPct = Math.round((1.0 - policyMultiplier) * 100);
      return `Under a restricted scenario (-${slowPct}% slowdown or funding cuts), progress in ${targetLabel.toLowerCase()} slows significantly by 2030. Delayed execution risks leaving vulnerable demographics unprotected and threatens long-term commitments for Goal ${goalNumber}.`;
    }
  }

  // Trajectory Forecast Statuses
  if (statusStr.includes('track')) {
    if (isLowerBetter) {
      return `${countryName} is making commendable progress in driving down ${details.indicatorName.toLowerCase()}. If current policy execution and health/social investments continue at this pace, the nation is on course to meet its 2030 milestone, significantly reducing risks and improving life quality.`;
    } else {
      return `${countryName} is demonstrating strong, steady momentum in expanding ${details.indicatorName.toLowerCase()}. Sustaining this trajectory through 2030 will ensure broad community access, strengthening foundational pillars for ${goalName}.`;
    }
  } else if (statusStr.includes('risk')) {
    return `${countryName} is progressing in the right direction for ${targetLabel.toLowerCase()}, but the current pace is fragile and risks falling short of 2030 benchmarks. Accelerating public funding allocations and strengthening regional administrative coordination will be vital to secure on-track status.`;
  } else {
    return `The current trajectory for ${targetLabel.toLowerCase()} in ${countryName} is lagging behind the pace needed to fulfill 2030 commitments. Targeted policy interventions, increased budget mobilization, and focused local execution are urgently required to reverse this trend and protect affected populations.`;
  }
}

/**
 * Backward compatible helper for existing imports
 */
export function generateLaymanInsight(status, baselineValue, projectedValue, targetCode, policyMultiplier = 1.0) {
  return generateDynamicLaymanInsight({
    status,
    targetCode,
    policyMultiplier,
  });
}
