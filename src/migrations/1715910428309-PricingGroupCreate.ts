import { MigrationInterface, QueryRunner } from "typeorm";

export class PricingGroupCreate1715910428309 implements MigrationInterface {
    name = 'PricingGroupCreate1715910428309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "pricing_group" (
                "id" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                CONSTRAINT "pricing_group_pkey" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "pricing_group_products" (
                "pricing_group_id" character varying NOT NULL,
                "product_id" character varying NOT NULL,
                CONSTRAINT "pricing_group_products_pricing_group_id_product_id_pkey" PRIMARY KEY ("pricing_group_id", "product_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_pricing_group_id" ON "pricing_group_products" ("pricing_group_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_product_id" ON "pricing_group_products" ("product_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "pricing_group_products"
            ADD CONSTRAINT "FK_pricing_group_products_pricing_group_id" FOREIGN KEY ("pricing_group_id") REFERENCES "pricing_group"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "pricing_group_products"
            ADD CONSTRAINT "FK_pricing_group_products_product_id" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "pricing_group_products" DROP CONSTRAINT "FK_pricing_group_products_pricing_group_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "pricing_group_products" DROP CONSTRAINT "FK_pricing_group_products_product_id"
        `);
        await queryRunner.query(`
            DROP TABLE "pricing_group_products"
        `);
        await queryRunner.query(`
            DROP TABLE "pricing_group"
        `);
    }

}
